// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {

    address payable contractOwner;              // ACCOUNT USED TO DEPLOY CONTRACT
    bool private operational = true;            // BLOCKS ALL STATE CHANGES THROUGHOUT THE CONTRACT IF FALSE

    mapping(address => bool) AuthorizedCallers; //AUTHORIZED CALLERS 
    
    using SafeMath for uint256;                 //LIBRARY USED TO EXECUTE MATH OPERATIONS


    /********************************************************************************************/
    /*                                      AIRLINE VARIABLES                                   */
    /********************************************************************************************/
    struct Airline {
        uint            airlineId;
        string          airlineName;
        address payable airlineAddress;
        bool            registered;
        bool            participant;
        bool            controller;
        uint            fundAvailable;
        uint            fundCommitted;
    }
    mapping(address => Airline) public airlines;

    address _firstAirlineAddress = 0xF258b0a25eE7D6f02a9a1118afdF77CaC6D72784;
    string _firstName = "Air New Zealand";


    /********************************************************************************************/
    /*                                  INSURANCE VARIABLES                                     */
    /********************************************************************************************/
    struct Insurance {
        uint            insuranceId;
        bytes32         flightKey;
        address payable passengerAddress;
        uint            amountPaid;
        uint            amountAvailable;
        bool            claimable;
        bool            active;
    }
    mapping(bytes32 => Insurance) insurances;
    mapping(uint => bytes32) insurancesReverse;
    mapping(address => bytes32[]) passengerInsurances;
    mapping(bytes32 => bytes32[]) flightInsurances;
    uint iCounter;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    modifier requireIsOperational() {
        require(operational, "CONTRACT IS CURRENTLY NOT OPERATIONAL");
        _;
    }

    modifier verifyCaller(address _address) {
        require(msg.sender == _address, "CALLER IS NOT ALLOWED TO EXECUTE FUNCTION"); 
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "CALLER IS NOT CONTRACT OWNER");
        _;
    }

    modifier requireAuthorizedCaller(){
        require(AuthorizedCallers[msg.sender] == true, "Caller is not authorized");
        _;
    }

    modifier paidEnough(uint _price) { 
        require(msg.value >= _price, "AMOUNT IS NOT ENOUGHT"); 
        _;
    }
  
    modifier checkParticipantValue() {
        require(msg.value == 10 ether, "AIRLINE MUST TRANSFER EXACTLY 10 ETHERS");
        _;
    }

    modifier checkPassengerValue() {
        require(msg.value >= 1 gwei && msg.value <= 1 ether, "CALLER MUST SPEND BETWEEN 1 GWEI AND 1 ETHER");
        _;
    }


    /********************************************************************************************/
    /*                                       CONSTRUCTOR DEFINITION                             */
    /********************************************************************************************/    
    /* The deploying account becomes contractOwner */
    constructor() {
        contractOwner = payable(msg.sender);
        airlines[_firstAirlineAddress] = Airline(
            {
                airlineId: 0,
                airlineName: _firstName,
                airlineAddress: payable(_firstAirlineAddress),
                registered: true,
                participant: false,
                controller: true,
                fundAvailable: 0,
                fundCommitted: 0
            });

    }

    function getFirstAirlineAddress() external view returns(address){
        return _firstAirlineAddress;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function kill() public requireContractOwner() {
        if (msg.sender == contractOwner) {
            selfdestruct(contractOwner);
        }
    }

    function isOperational() external view returns(bool) {
        return operational;
    }

    function authorizeCaller(address _caller) public requireContractOwner {
        AuthorizedCallers[_caller] = true;
    }

    function isAuthorized(address _caller) public view returns(bool) {
        return AuthorizedCallers[_caller];
    }

    function deAuthorizeCaller(address _caller) public requireContractOwner {
        AuthorizedCallers[_caller] = false;
    }


    /********************************************************************************************/
    /*                       SMART CONTRACT REGISTER AIRLINES FUNCTIONS                         */
    /********************************************************************************************/
    function registerAirline(string memory _name, address _address, uint _aCounter, bool _controller) external requireAuthorizedCaller() requireIsOperational() {
        airlines[_address] = Airline(
            {
                airlineId: _aCounter,
                airlineName: _name,
                airlineAddress: payable(_address),                    
                registered: true,
                participant: false,
                controller: _controller,
                fundAvailable: 0,
                fundCommitted: 0
            }
        );
    }


    /********************************************************************************************/
    /*                          SMART CONTRACT PARTICIPANT FUNCTIONS                            */
    /********************************************************************************************/
    function fund(address _address) external payable paidEnough(10 ether) checkParticipantValue() requireIsOperational() {
        contractOwner.transfer(msg.value);

        airlines[_address].participant = true;
        airlines[_address].fundAvailable = msg.value;
    }


    /********************************************************************************************/
    /*                                  KEYS GENEARTOR FUNCTIONS                                */
    /********************************************************************************************/
    function getInsuranceKey(address _passengerAddress, bytes32 _flightKey) pure internal returns(bytes32) {
        bytes32 _addressToBytes32 = bytes32(uint256(uint160(_passengerAddress)) << 96);
        return keccak256(abi.encodePacked(_addressToBytes32, _flightKey));
        //return keccak256(abi.encodePacked(_passengerAddress, _flightKey));
    }


    /********************************************************************************************/
    /*                              SMART CONTRACT BUYING FUNCTIONS                             */
    /********************************************************************************************/
    function buy(address _passengerAddress, bytes32 _flightKey, address _airlineAddress) external payable 
    checkPassengerValue() requireAuthorizedCaller() requireIsOperational() {        
        
        bytes32 _insuranceKey = getInsuranceKey(_passengerAddress, _flightKey);
        
        require(insurances[_insuranceKey].flightKey != _flightKey, "ERROR: PASSENGER ALREADY BOUGHT THIS FLIGHT INSURANCE");
        contractOwner.transfer(msg.value);
        
        iCounter ++;
        insurances[_insuranceKey] = Insurance(
            {
                insuranceId: iCounter,
                flightKey: _flightKey,
                passengerAddress: payable(_passengerAddress),
                amountPaid: msg.value,
                amountAvailable: 0,
                claimable: false,
                active: true
            }
        );
        insurancesReverse[iCounter] = _insuranceKey;
        passengerInsurances[_passengerAddress].push(_insuranceKey);
        flightInsurances[_flightKey].push(_insuranceKey);

        airlines[_airlineAddress].fundAvailable = SafeMath.add(airlines[_airlineAddress].fundAvailable, msg.value);
        airlines[_airlineAddress].fundCommitted = SafeMath.div(SafeMath.mul(msg.value, 15), 10);
    }

    function creditInsurees(bytes32 _flightKey, address _airlineAddress) 
    external requireAuthorizedCaller() requireIsOperational() {
        require(flightInsurances[_flightKey].length > 0, "ERROR: INSURANCE NOT FOUND");

        for(uint c = 0; c < flightInsurances[_flightKey].length; c++) {
            bytes32 _insuranceKey = flightInsurances[_flightKey][c];
            require(insurances[_insuranceKey].claimable, "ERROR: NOTHING TO CLAIM");

            uint _amountPaid = insurances[_insuranceKey].amountPaid;
            uint _amountToCredit = SafeMath.div(SafeMath.mul(_amountPaid, 15), 10);

            uint _fundAvailable = airlines[_airlineAddress].fundAvailable;
            uint _fundCommitted = airlines[_airlineAddress].fundCommitted;

            insurances[_insuranceKey].amountAvailable = _amountToCredit;

            airlines[_airlineAddress].fundAvailable = SafeMath.sub(_fundAvailable, _amountToCredit);
            airlines[_airlineAddress].fundCommitted = SafeMath.sub(_fundCommitted, _amountToCredit);
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address _passengerAddress, bytes32 _flightKey) public payable requireIsOperational() {
        bytes32 _insuranceKey = getInsuranceKey(_passengerAddress, _flightKey);
        payable(_passengerAddress).transfer(insurances[_insuranceKey].amountAvailable);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback() external payable {
    }
    
    receive() external payable {
    }


    /********************************************************************************************/
    /*                               SMART CONTRACT CHECK FUNCTIONS                             */
    /********************************************************************************************/
    function checkAirlines(address _airlineAddress) external view requireAuthorizedCaller() requireIsOperational()
        returns(string memory name_, address address_, bool registered_, bool participant_, bool controller_, uint fundavailable_, uint fundcommitted_)  
    {
        
        return(airlines[_airlineAddress].airlineName
            , airlines[_airlineAddress].airlineAddress
            , airlines[_airlineAddress].registered
            , airlines[_airlineAddress].participant
            , airlines[_airlineAddress].controller
            , airlines[_airlineAddress].fundAvailable
            , airlines[_airlineAddress].fundCommitted
        );
    
    }
    
    function checkInsurances(uint _insuranceId) external view requireAuthorizedCaller() requireIsOperational()
        returns(bytes32 insuranceKey_, bytes32 flightKey_, address passengerAddress_, uint amountPaid_, uint amountAvailable_, bool claimable_, bool active_) 
    {
        bytes32 _insuranceKey = insurancesReverse[_insuranceId];
        require(insurances[_insuranceKey].flightKey != 0, "ERROR: INSURANCE NOT FOUND");
        return(_insuranceKey
            , insurances[_insuranceKey].flightKey
            , insurances[_insuranceKey].passengerAddress
            , insurances[_insuranceKey].amountPaid
            , insurances[_insuranceKey].amountAvailable
            , insurances[_insuranceKey].claimable
            , insurances[_insuranceKey].active
        );
    }

    function checkPassengerInsurances(address _passengerAddress) external view requireAuthorizedCaller() requireIsOperational() returns(bytes32[] memory) {
        return passengerInsurances[_passengerAddress];
    }

    function checkInsuranceAmountPaid(address _passengerAddress, bytes32 _flightKey) external view requireIsOperational() returns(uint amountPaid_) {
        bytes32 _insuranceKey = getInsuranceKey(_passengerAddress, _flightKey);
        require(insurances[_insuranceKey].flightKey == _flightKey, "ERROR: INSURANCE NOT FOUND");
        return insurances[_insuranceKey].amountPaid;
    }

}