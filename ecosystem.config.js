
module.exports = {
    apps: [
        {
            name: 'repairos-backend',
            script: 'dist/main.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                // Add DATABASE_URL here or in system environment
            }
        }
    ]
};
