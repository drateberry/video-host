module.exports = {
  apps: [
    {
      name: "video-host",
      script: "npm",
      args: "start -- -p 3001",
      cwd: __dirname,
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
