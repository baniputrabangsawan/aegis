FROM postgres:17-alpine
COPY backup-now.sh /usr/local/bin/backup-now
COPY backup-loop.sh /usr/local/bin/backup-loop
COPY restore-backup.sh /usr/local/bin/restore-backup
RUN chmod 0555 /usr/local/bin/backup-now /usr/local/bin/backup-loop /usr/local/bin/restore-backup
VOLUME ["/backups"]
CMD ["backup-loop"]
