/* eslint key-spacing:0 */
export default (config) => ({
  compiler_fail_on_warning : false,
  compiler_hash_type       : 'chunkhash',
  compiler_devtool         : null,
  compiler_stats           : {
    chunks : true,
    chunkModules : true,
    colors : true
  },
  globals: {
    ...config.globals,
    __API_ROOT__: JSON.stringify('http://localhost:3000/api')
  }
});
