module.exports = {
  apps: [
    {
      name: "skyservices-erp",
      cwd: "/var/www/skyservices-erp/app",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3002",
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      error_file: "/var/www/skyservices-erp/logs/erp-error.log",
      out_file: "/var/www/skyservices-erp/logs/erp-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
