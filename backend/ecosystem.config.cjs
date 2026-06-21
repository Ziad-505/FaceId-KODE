// PM2 process definition for the KODE Face-ID backend.
// CommonJS (.cjs) on purpose: the app itself is ESM ("type":"module"),
// but PM2 reads its config as CommonJS.
//
//   pm2 start ecosystem.config.cjs        (first launch)
//   pm2 startOrReload ecosystem.config.cjs --update-env   (deploys)
//   pm2 save                              (persist process list for reboot)
//
// Secrets/DB config are NOT here — they come from backend/.env (dotenv loads it).

module.exports = {
  apps: [
    {
      name: 'kode-faceid-backend',
      cwd: __dirname,
      script: 'src/server.js',
      exec_mode: 'fork',     // single instance; JWT auth is stateless so cluster is possible later
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      // PM2 captures stdout/stderr (the app logs structured JSON to stdout).
      out_file: 'C:\\pm2-logs\\kode-faceid-out.log',
      error_file: 'C:\\pm2-logs\\kode-faceid-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
