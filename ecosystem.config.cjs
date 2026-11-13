module.exports = {
	apps: [
		{
			name: 'faa-tool',
			script: 'npm',
			args: 'run start',
			instances: 1,
			autorestart: true,
			max_memory_restart: '256M',
			log_date_format: 'YYYY-MM-DD HH:mm:ss',
			error_file: '/var/log/faa-tool/error.log',
			out_file: '/var/log/faa-tool/app.log',
			merge_logs: true,
			exec_mode: 'fork',
			env: {
				PORT: 9002,
				HOST: '127.0.0.1',
				NODE_ENV: 'production',
				ORIGIN: 'https://joshuacurry.dev',
				// Real client IP from the reverse proxy, for rate limiting
				ADDRESS_HEADER: 'X-Forwarded-For',
				XFF_DEPTH: 1
			}
		}
	]
};
