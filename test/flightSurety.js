var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract("FLIGHT SURETY TESTS", async (accounts) => {

    var config;
    before("SETUP CONTRACT", async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });


    /* OPERATIONS AND SETTINGS */
    it("(MULTIPARTY) HAS CORRECT INITIAL ISOPERATIONAL() VALUE", async function () {
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "INCORRECT INITIAL OPERATING STATUS VALUE");
    });


    it("(MULTIPARTY) CAN BLOCK ACCESS TO setOperatingStatus() FOR NON-CONTRACT OWNER ACCOUNT", async function () {
        let accessDenied = false;
        try
        {
            await config.flightSuretyApp.setOperatingStatus(false, { from: config.testAddresses[2]});
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "ACCESS NOT RESTRICTED TO CONTRACT OWNER");
    });


    it("(MULTIPARTY) CAN ALLOW ACCESS TO setOperatingStatus() FOR CONTRACT OWNER ACCOUNT", async function () {
        let accessDenied = false;
        try 
        {
            await config.flightSuretyApp.setOperatingStatus(false, { from: config.owner });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "ACCESS NOT RESTRICTED TO CONTRACT OWNER");
    });


    // it("(MULTIPARTY) CAN BLOCK ACCESS TO FUNCTIONS USING REQUIREISOPERATIONAL WHEN OPERATING STATUS IS FALSE", async function () {

    //     await config.flightSuretyApp.setOperatingStatus(false);

    //     let reverted = false;
    //     try 
    //     {
    //         await config.flightSurety.setTestingMode(true);
    //     }
    //     catch(e) {
    //         reverted = true;
    //     }
    //     assert.equal(reverted, true, "ACCESS NOT BLOCKED FOR REQUIREISOPERATIONAL");      

    //     // Set it back for other tests to work
    //     await config.flightSuretyData.setOperatingStatus(true);

    // });


    /* REGISTER AIRLINE */    
    it("ONLY CONTROLLERS CAN REGISTER NEW AIRLINES", async () => {    
        let newAirlineName2 = "Air 2";
        let newAirlineAddress2 = accounts[2];
        try {
            await config.flightSuretyApp.registerAirline(newAirlineName2, newAirlineAddress2, {from: config.owner});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isRegistered.call(newAirlineAddress2);
        assert.equal(result, true, "CONTROLLERS SHOULD BE ABLE TO REGISTER NEW AIRLINES");
    });    


    it("ONLY CONTROLLERS CAN REGISTER NEW AIRLINES 2", async () => {    
        let airlineAddress2 = accounts[2];
        let newAirlineName3 = "Air 3";
        let newAirlineAddress3 = accounts[3];
        try {
            await config.flightSuretyApp.registerAirline(newAirlineName3, newAirlineAddress3, {from: airlineAddress2});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isRegistered.call(newAirlineAddress3);

        assert.equal(result, true, "CONTROLLERS SHOULD BE ABLE TO REGISTER NEW AIRLINES");
    });


    it("REGISTRATION OF FIFTH AND SUBSEQUENT AIRLINES REQUIRES MULTI-PARTY CONSENSUS OF 50% OF REGISTERED AIRLINES", async () => {
        let newAirlineName4 = "Air 4";
        let newAirlineAddress4 = accounts[4];
        let newAirlineName5 = "Air 5";
        let newAirlineAddress5 = accounts[5];
        let newAirlineName6 = "Air 6";
        let newAirlineAddress6 = accounts[6];
        try {
            await config.flightSuretyApp.registerAirline(newAirlineName4, newAirlineAddress4, {from: config.owner});
            await config.flightSuretyApp.registerAirline(newAirlineName5, newAirlineAddress5, {from: config.owner});
            await config.flightSuretyApp.registerAirline(newAirlineName6, newAirlineAddress6, {from: config.owner});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isRegistered.call(newAirlineAddress5);

        assert.equal(result, false, "5TH AIRLINE SHOULD NOT BE REGISTERED");
    });


    /* VOTING AIRLINE */
    it("REGISTERING NEW AIRLINE THROUGH MULTI-PARTY CONSENSUS", async () => {
        let airlineAddress2 = accounts[2];
        let airlineAddress3 = accounts[3];
        let newAirlineName5 = "Air 5";
        let newAirlineAddress5 = accounts[5];
        try {
            await config.flightSuretyApp.vote(newAirlineName5, newAirlineAddress5, {from: airlineAddress2});
            await config.flightSuretyApp.vote(newAirlineName5, newAirlineAddress5, {from: airlineAddress3});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isRegistered.call(newAirlineAddress5);

        assert.equal(result, true, "5TH AIRLINE SHOULD BE REGISTERED. 50% CONSENSUS REACHED");
    });
 

    it("REGISTERING NEW AIRLINE THROUGH MULTI-PARTY CONSENSUS 2", async () => {
        let airlineAddress2 = accounts[2];
        let airlineAddress3 = accounts[3];
        let newAirlineName6 = "Air 6";
        let newAirlineAddress6 = accounts[6];
        try {
            await config.flightSuretyApp.vote(newAirlineName6, newAirlineAddress6, {from: airlineAddress2});
            await config.flightSuretyApp.vote(newAirlineName6, newAirlineAddress6, {from: airlineAddress3});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isRegistered.call(newAirlineAddress6);

        assert.equal(result, false, "6TH AIRLINE SHOULD NOT BE REGISTERED. 50% CONSENSUS NOT REACHED");
    });


    /* FUNDING AIRLINE */
    it("AIRLINE CAN BE REGISTERED, BUT DOES NOT PARTICIPATE IN CONTRACT UNTIL IT SUBMITS FUNDING OF 10 ETHER", async () => {
        let airlineAddress2 = accounts[2];
        let payment = web3.utils.toWei("10", "ether").toString();
        try {
            await config.flightSuretyApp.fund({from: airlineAddress2, value: payment, gasPrice: 0, gas:230000});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.isParticipant.call(airlineAddress2);

        assert.equal(result, true, "AIRLINE IS A PARTICIPANT AFTER FUNDING 10 ETHER");
    });


    /* REGISTER FLIGHT */
    it("PARTICIPANT AIRLINES CAN REGISTER NEW FLIGHTS", async () => {
        let airlineAddress2 = accounts[2];
        let flight  = "NZ123";
        let day = 10;
        let month = 10;
        let year = 2030;
        let hour = 10;
        let minute = 00;
        try {
            await config.flightSuretyApp.registerFlight(flight, year, month, day, hour, minute, {from: airlineAddress2});
            //console.log(await config.flightSuretyApp.checkFlights(1));
        }
        catch(e) {
            console.log(e);
        }
        let timestamp = await config.flightSuretyApp.getDateTime(year, month, day, hour, minute);
        let flightKey = await config.flightSuretyApp.getFlightKey(airlineAddress2, flight, timestamp);
        let result = await config.flightSuretyApp.checkFlight.call(flightKey);

        assert.equal(result, true, "FLIGHT SHOULD BE REGISTERED");
    });


    /* BUY FLIGHT */
    it("PASSENGER CAN BUY A FLIGHT", async () => {   
        let newPassengerAddress = accounts[7]; 
        let payment = web3.utils.toWei("1", "ether").toString();
        let flightOption = 1;
        try {
            await config.flightSuretyApp.buy(flightOption, {from: newPassengerAddress, value: payment, gasPrice: 0, gas:500000});
        }
        catch(e) {
            console.log(e);
        }
        let result = await config.flightSuretyApp.checkInsuranceAmountPaid.call(flightOption, {from: newPassengerAddress});

        assert.equal(result, payment, "CONTROLLERS SHOULD BE ABLE TO REGISTER NEW AIRLINES");
    });

});