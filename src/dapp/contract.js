import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        this.owner = null;
        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.appAddress = config.appAddress;
        this.initialize(callback);
        this.airlines = [];
        this.passengers = [];
        this.accounts = [];
    }
    
    async initialize(callback) {
        if (window.ethereum) {
            try {
                this.web3 = new Web3(window.ethereum);
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("USER DENIED ACCOUNT ACCESS")
            }
        }
        if (typeof this.web3 == "undefined") {
            this.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
            console.log("local ganache provider");
        }
        

        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            this.accounts = accts;
            // console.log(this.accounts);

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            this.flightSuretyData.methods.authorizeCaller(this.appAddress).send({from: this.owner}, (error, result) => {
                if(error) {
                    console.log("Could not authorize the App contract");
                    console.log(error);
                }
            });

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline, flight, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.accounts[0]}, (error, result) => {
                callback(error, payload);
            });
    }

    viewFlightStatus(airline, flight, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight
        }
        self.flightSuretyApp.methods
            .viewFlightStatus(payload.flight, payload.airline)
            .call({ from: self.accounts[0]}, (error, result) => {
                callback(error, result);
            });
    }

    async registerAirline(address, name, sender, callback) {
        let self = this;
        let payload = {
            airlineAddress: address,
            name: name,
            sender: sender
        }
        await this.web3.eth.getAccounts((error, accts) => {
            payload.sender = accts[0];
        });
        self.flightSuretyApp.methods
            .registerAirline(payload.airlineAddress, payload.name)
            .send({ from: payload.sender,
                gas: 5000000,
                gasPrice: 20000000
            }, (error, result) => {
                if (error) {
                    console.log(error);
                    callback(error, payload);
                } else {
                    self.flightSuretyData.methods.
                    isRegistered(payload.airlineAddress).call({ from: payload.sender}, (error, result) => {
                        if (error || result.toString() === 'false') {
                            payload.message = 'New airline needs at least 4 votes to get registered.';
                            payload.registered = false;
                            callback(error, payload);
                        } else {
                            payload.message = 'Registered ' + payload.airlineAddress + ' as ' + payload.name;
                            payload.registered = true;
                            callback(error, payload);
                        }
                    });
                }
            });
    }

    async fund(funds, callback) {
        let self = this;
        let value = this.web3.utils.toWei(funds.toString(), "ether");
        let payload = {
            funds: value,
            funder: 0x00,
            active: "false"
        } 
        await this.web3.eth.getAccounts((error, accts) => {
            payload.funder = accts[0];
        });
        self.flightSuretyData.methods
            .fund()
            .send({ from: payload.funder, value: value}, (error, result) => {
                if (!error){
                    self.flightSuretyData.methods.
                    isActive(payload.funder).call({ from: payload.funder}, (error, result) => {
                        if(!error){
                            payload.active = result;
                        }
                        callback(error, payload);
                    });
                }
            });
    }

    async registerFlight(flight, destination, callback) {
        let self = this;
        let payload = {
            flight: flight,
            destination: destination,
            timestamp: Math.floor(Date.now() / 1000)
        }
        await this.web3.eth.getAccounts((error, accts) => {
            self.accounts = accts;
        });
        self.flightSuretyApp.methods
            .registerFlight(payload.flight, payload.destination, payload.timestamp)
            .send({ from: self.accounts[0],
                gas: 5000000,
                gasPrice: 20000000}, (error, result) => {
                callback(error, payload);
            });
    }

    async buy(flight, price, callback) {
        let self = this;
        let priceInWei = this.web3.utils.toWei(price.toString(), "ether");
        let payload = {
            flight: flight,
            price: priceInWei,
            passenger: self.accounts[0]
        } 
        await this.web3.eth.getAccounts((error, accts) => {
            payload.passenger = accts[0];
        });
        self.flightSuretyData.methods
            .buy(flight)
            .send({ from: payload.passenger, value: priceInWei,
                gas: 500000,
                gasPrice: 1
            }, (error, result) => {
                callback(error, payload);
            });
    }

    async getCreditToPay(callback) {
        let self = this;
        await this.web3.eth.getAccounts((error, accts) => {
            self.accounts = accts;
        });
        self.flightSuretyData.methods.
        getCreditToPay().call({ from: self.accounts[0]}, (error, result) => {
            callback(error, result);
        });
    }

    async pay(callback) {
        let self = this;
        await this.web3.eth.getAccounts((error, accts) => {
            self.accounts = accts;
        });
        self.flightSuretyData.methods.
        withdraw(self.accounts[0]).send({ from: self.accounts[0]}, (error, result) => {
            callback(error, result);
        });
    }
}