const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const DateLib = artifacts.require("DateLib");
//const RoleLib = artifacts.require("RoleLib");

const fs = require('fs');

module.exports = function (deployer) {

    deployer.deploy(FlightSuretyData);
    //deployer.deploy(RoleLib);
    deployer.deploy(DateLib);
    deployer.link(DateLib, FlightSuretyApp)
    .then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
        .then(() => {
            let config = {
                localhost: {
                    url: 'http://localhost:7545',
                    dataAddress: FlightSuretyData.address,
                    appAddress: FlightSuretyApp.address
                }
            }
            fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
            fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
        });
    });
};