from kubernetes import client, config
from ..config import get_settings
from ..models.backup_config import BackupConfig as BackupConfigModel
import yaml

settings = get_settings()

try:
    config.load_incluster_config()
except:
    try:
        config.load_kube_config()
    except:
        print("Warning: Could not load K8s config. Scheduler will fail if called.")

batch_v1 = client.BatchV1Api()
core_v1 = client.CoreV1Api()

class SchedulerService:
    
    def _get_cronjob_name(self, tenant_id: str) -> str:
        return f"backup-{tenant_id.lower()}"

    def create_or_update_cronjob(self, backup_config: BackupConfigModel, secret_name: str):
        name = self._get_cronjob_name(backup_config.tenant_id)
        namespace = settings.K8S_NAMESPACE
        
        # Prepare Env Vars
        env_vars = [
            client.V1EnvVar(name="TENANT_ID", value=backup_config.tenant_id),
            client.V1EnvVar(name="BACKUP_SOURCES", value=str(backup_config.sources)), # JSON string
            client.V1EnvVar(name="RETENTION_DAILY", value=str(backup_config.retention_daily)),
            client.V1EnvVar(name="RETENTION_WEEKLY", value=str(backup_config.retention_weekly)),
            client.V1EnvVar(name="RETENTION_MONTHLY", value=str(backup_config.retention_monthly)),
            # Secrets
            client.V1EnvVar(
                name="RESTIC_PASSWORD",
                value_from=client.V1EnvVarSource(
                    secret_key_ref=client.V1SecretKeySelector(name=secret_name, key="restic-password")
                )
            ),
            client.V1EnvVar(
                name="RCLONE_CONFIG_JSON",
                value_from=client.V1EnvVarSource(
                    secret_key_ref=client.V1SecretKeySelector(name=secret_name, key="rclone-config")
                )
            ),
             # Database URL for pg_dump
            client.V1EnvVar(
                name="DATABASE_URL",
                 value_from=client.V1EnvVarSource(
                    secret_key_ref=client.V1SecretKeySelector(name="postgresql-secret", key="postgres-url")
                )
            )
        ]

        # Container Spec
        container = client.V1Container(
            name="backup-worker",
            image=settings.BACKUP_WORKER_IMAGE,
            image_pull_policy="Always",
            env=env_vars,
            resources=client.V1ResourceRequirements(
                requests={"memory": "256Mi", "cpu": "100m"},
                limits={"memory": "1Gi", "cpu": "1000m"}
            )
        )

        # Job Template
        job_template = client.V1JobTemplateSpec(
            spec=client.V1JobSpec(
                template=client.V1PodTemplateSpec(
                    spec=client.V1PodSpec(
                        restart_policy="Never",
                        containers=[container],
                        image_pull_secrets=[client.V1LocalObjectReference(name="ghcr-secret")]
                    )
                ),
                backoff_limit=2,
                active_deadline_seconds=7200, # 2 hours
                ttl_seconds_after_finished=86400 # Keep for 1 day for logs
            )
        )

        # CronJob Spec
        cron_job = client.V1CronJob(
            metadata=client.V1ObjectMeta(name=name, labels={"app": "backup-worker", "tenant": backup_config.tenant_id}),
            spec=client.V1CronJobSpec(
                schedule=backup_config.schedule_cron,
                job_template=job_template,
                concurrency_policy="Forbid",
                successful_jobs_history_limit=3,
                failed_jobs_history_limit=3
            )
        )

        try:
            # Try to get existing
            existing = batch_v1.read_namespaced_cron_job(name, namespace)
            # Update
            existing.spec = cron_job.spec
            batch_v1.patch_namespaced_cron_job(name, namespace, existing)
            print(f"Updated CronJob {name}")
        except client.exceptions.ApiException as e:
            if e.status == 404:
                # Create
                batch_v1.create_namespaced_cron_job(namespace, cron_job)
                print(f"Created CronJob {name}")
            else:
                raise e

    def delete_cronjob(self, tenant_id: str):
        name = self._get_cronjob_name(tenant_id)
        namespace = settings.K8S_NAMESPACE
        try:
            batch_v1.delete_namespaced_cron_job(name, namespace)
            print(f"Deleted CronJob {name}")
        except client.exceptions.ApiException as e:
            if e.status != 404:
                raise e
