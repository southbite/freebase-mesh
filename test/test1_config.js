module.exports = {
  webServerPort: 80,
  orchestration: [
    {
      instanceName: 'Component1Instance',
      module: './test/component1'
    },
    {
      instanceName: 'Component2Instance',
      module: './test/component2',
      dataSubscriptions:
        [
          'Component1Instance/value'
        ],
      options:{
        valueStore:'Component1Instance'
      }
    }
  ]
};

