var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('ORACLES', async (accounts) => {

    const TEST_ORACLES_COUNT = 5;
    var config;
    before('SETUP CONTRACT', async () => {
        config = await Test.Config(accounts);
        // Watch contract events
        const STATUS_CODE_UNKNOWN = 0;
        const STATUS_CODE_ON_TIME = 10;
        const STATUS_CODE_LATE_AIRLINE = 20;
        const STATUS_CODE_LATE_WEATHER = 30;
        const STATUS_CODE_LATE_TECHNICAL = 40;
        const STATUS_CODE_LATE_OTHER = 50;

    });

    it('CAN REGISTER ORACLES', async () => {
        
        // ARRANGE
        let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

        // ACT
        for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
            await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
            let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
            console.log(`ORACLE REGISTERED: ${result[0]}, ${result[1]}, ${result[2]}`);
        }
    });

    it('CAN REQUEST FLIGHT STATUS', async () => {
        
        // ARRANGE
        let flight = 'ND1309'; // Course number
        let timestamp = Math.floor(Date.now() / 1000);
        //let timestamp = 1646123400;

        // Submit a request for oracles to get status information for a flight
        await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
        // ACT

        //console.log(await config.flightSuretyApp.checkFlights(1));

        // Since the Index assigned to each test account is opaque by design
        // loop through all the accounts and for each account, all its Indexes (indices?)
        // and submit a response. The contract will reject a submission if it was
        // not requested so while sub-optimal, it's a good test of that feature
        for(let a=1; a<TEST_ORACLES_COUNT; a++) {

            // Get oracle information
            let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
            for(let idx=0;idx<3;idx++) {

                try {
                    // Submit a response...it will only be accepted if there is an Index match
                    await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, 10, { from: accounts[a] });

                }
                catch(e) {
                    console.log(e)
                    // Enable this when debugging
                    console.log('\nERROR', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
                }

            }
        }
    });
    
});