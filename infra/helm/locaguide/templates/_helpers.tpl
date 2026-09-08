{{- define "locaguide.databaseUrl" -}}
{{- if .Values.externalDatabaseUrl }}{{ .Values.externalDatabaseUrl }}{{- else -}}postgresql://locaguide:$(POSTGRES_PASSWORD)@postgres:5432/locaguide{{- end -}}
{{- end -}}

{{- define "locaguide.redisUrl" -}}
{{- if .Values.externalRedisUrl }}{{ .Values.externalRedisUrl }}{{- else -}}redis://redis:6379{{- end -}}
{{- end -}}
