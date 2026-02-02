
module.exports = {
    apps: [
        {
            name: 'repairos-backend',
            script: 'dist/main.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3005, // Updated for VPS safety
                // Add DATABASE_URL here or in system environment
            }
        }
    ]
};
