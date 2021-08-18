module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
                asar: false,
                win: {
                    icon: 'public/favicon.ico'
                }
            }
        }
    }
}