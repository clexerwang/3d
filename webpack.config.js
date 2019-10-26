const webpack = require('webpack');

module.exports = {
    mode:'development',
    entry:__dirname+'/src/index.jsx',
    devtool:'source-map',
    output:{
        filename:'bundle.js',
        path:__dirname+'/dist'
    },
    devServer:{
        contentBase: __dirname+"/dist",
        hot:true,
        inline:true
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin()
    ],
    module:{
        rules:[
            {
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        plugins: [
                            ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css"}]
                        ]
                    }
                },
            },{
                test: /\.css$/,
                use: ["style-loader","css-loader"],
            },{
                test: /antd.*\.less$/,
                use: ["style-loader",
                    {
                        loader: 'css-loader'
                    },
                    "postcss-loader", "less-loader"
                ],
                include: /node_modules/
            }
        ]
    }
}