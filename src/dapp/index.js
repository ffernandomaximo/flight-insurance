
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip().mouseover();
    setTimeout(function(){ $('[data-toggle="tooltip"]').tooltip('hide'); }, 3000);
});

(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {
       
        DOM.elid('UdacityAir').value = contract.owner;
        DOM.elid('selected-airline-name').value = 'UdacityAir';
        DOM.elid('selected-airline-address').value = contract.owner;

        // Read transaction
        contract.isOperational((error, result) => {
            display('DAPP logs', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', async () => {
            let flight = DOM.elid('flight-number').value;
            let selectedAirlineAddress = DOM.elid('selected-airline-address').value;
            
            // Write transaction
            contract.fetchFlightStatus(selectedAirlineAddress, flight, (error, result) => {
                display('', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + getTimeFromTimestamp(result.timestamp)} ]);
                let newTime = result.timestamp;
                displaySpinner();
                setTimeout(() => {
                    contract.viewFlightStatus(selectedAirlineAddress, flight, (error, result) => {
                        if (!error) {
                            changeFlightStatus(flight, result, newTime);
                        }
                    });
                    hideSpinner();
                }, 2000);
            });
        })

        // User-submitted transaction
        DOM.elid('register-airline').addEventListener('click', async() => {
            let address = DOM.elid('airline-address').value;
            let name = DOM.elid('airline-name').value;
            let sender = DOM.elid('selected-airline-address').value;

            // Write transaction
            contract.registerAirline(address, name, sender, (error, result) => {
                display('', 'New airline address and name: ', [ { label: 'Register Airline', error: error, value: result.message} ]);
                if(error){
                    console.log(error);
                } else if (result.registered == true) {
                    addAirlineOption(name, address);
                }
            });
        })
        
        // User-submitted transaction
        DOM.elid('fund').addEventListener('click', async() => {
            let funds = DOM.elid('funds').value;
            // Write transaction
            contract.fund(funds, (error, result) => {
                display('', `Funds added`, [ { label: 'Funds added to airline: ', error: error, value: result.funds+" wei"} ]);
                display('', '', [ { label: 'Airline is active: ', value: result.active} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('register-flight').addEventListener('click', async() => {
            let flight = DOM.elid('new-flight-number').value;
            let destination = DOM.elid('new-flight-destination').value;
            
            // Write transaction
            contract.registerFlight(flight, destination, (error, result) => {
                display('', 'Register new flight', [ { label: 'Info:', error: error, value: 'Flight code: '+result.flight + ' Destination: ' + result.destination} ]);
                if (!error) {
                    flightDisplay(flight, destination, result.address, result.timestamp);
                }
            });
        })

        // User-submitted transaction
        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('insurance-flight').value;
            let price = DOM.elid('insurance-price').value;
            // Write transaction
            contract.buy(flight, price, (error, result) => {
                display('', 'Bought a new flight insurance', [ { label: 'Insurance info', error: error, value: `Flight: ${result.flight}. Paid: ${result.price} wei. Passenger: ${result.passenger}`} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('check-credit').addEventListener('click', () => {
            // Write transaction
            contract.getCreditToPay((error, result) => {
                if(error){
                    console.log(error);
                    let creditDisplay = DOM.elid("credit-ammount");
                    creditDisplay.value = "Error happened while getting your credit";
                } else {
                    let creditDisplay = DOM.elid("credit-ammount");
                    creditDisplay.value = result+" wei";
                }
            });
        })

        // User-submitted transaction
        DOM.elid('claim-credit').addEventListener('click', () => {
            // Write transaction
            contract.pay((error, result) => {
                if(error){
                    console.log(error);
                    alert("Error! Could not withdraw the credit.");
                } else {
                    let creditDisplay = DOM.elid("credit-ammount");
                    alert(`Successfully withdrawed ${creditDisplay.value} wei!`);
                    creditDisplay.value = "0 ethers";
                }
            });
        })

        DOM.elid('airlineDropdownOptions').addEventListener('click', (e) => {
            e.preventDefault();
            
            DOM.elid("selected-airline-name").value = e.srcElement.innerHTML;
            DOM.elid("selected-airline-address").value = e.srcElement.value;
        })
    });
    
    DOM.elid('statusButton').addEventListener('click', async(e) => {
        e.preventDefault();
        let buttonValue = e.srcElement.value;
        const response = await fetch(`http://localhost:3000/api/status/${buttonValue}`);
        const myJson = await response.json();
        console.log(myJson);
        display('', 'Default flights status change submited to server.', [ { label: 'Server response: ', value: myJson.message} ]);
    })

    DOM.elid('flights-display').addEventListener('click', async(e) => {
        let flightCode = e.srcElement.innerHTML;
        console.log(e);
        console.log(flightCode);
        flightCode = flightCode.replace("✈ ", "").replace("<b>", "").replace("</b>", "");
        navigator.clipboard.writeText(flightCode).then(function() {
            console.log(`Async: Copying to clipboard was successful! Copied: ${flightCode}`);
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    })


    


})();

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    if(title != ''){
        section.appendChild(DOM.h2(title));
    }
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

let flightCount = 0;

function flightDisplay(flight, destination, airlineName, time) {
    var table = DOM.elid("flights-display");

    flightCount++;
    var row = table.insertRow(flightCount);
    row.id = flight;
    
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    
    var date = new Date(+time);
    // Add some text to the new cells:
    cell1.innerHTML = "<b>✈ " + flight+"</b>";
    cell1.setAttribute("data-toggle",  "tooltip");
    cell1.setAttribute("data-placement",  "top");
    cell1.title="Click on flight code to copy";
    cell2.innerHTML = destination.toUpperCase();
    cell3.innerHTML = date.getHours()+":"+date.getMinutes();
    cell4.innerHTML = "ON TIME";
    cell4.style="color:green";
    $('[data-toggle="tooltip"]').tooltip().mouseover();
       setTimeout(function(){ $('[data-toggle="tooltip"]').tooltip('hide'); }, 3000);
}

function addAirlineOption(airlineName, hash) {
    var dropdown = DOM.elid("airlineDropdownOptions");

    let newOption = DOM.button({className: 'dropdown-item', value: hash, type:"button"}, airlineName);
    dropdown.appendChild(newOption);
}

function displaySpinner() {
    document.getElementById("oracles-spinner").hidden = false;
    document.getElementById("submit-oracle").disabled = true;
}

function hideSpinner() {
    document.getElementById("oracles-spinner").hidden = true;
    document.getElementById("submit-oracle").disabled = false;
}

function changeFlightStatus(flight, status, newTime) {
    console.log(status);
    var row = DOM.elid(flight);
    row.deleteCell(3);
    row.deleteCell(2);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    let statusText = "";
    switch(status) {
        case '10':
            statusText = "ON TIME";
            cell3.style="color:white";
            cell4.style="color:green";
            break;
        case '20':
            statusText = "LATE AIRLINE";
            cell3.style="color:red";
            cell4.style="color:red";
            break;
        case '30':
            statusText = "LATE WEATHER";
            cell3.style="color:red";
            cell4.style="color:yellow";
            break;
        case '40':
            statusText = "LATE TECHNICAL";
            cell3.style="color:red";
            cell4.style="color:yellow";
            break;
        case '50':
            statusText = "LATE OTHER";
            cell3.style="color:red";
            cell4.style="color:yellow";
            break;
        default:
            statusText = "UNKNOWN";
            cell3.style="color:white";
            cell4.style="color:white";
            break;
      }
    cell3.innerHTML = getTimeFromTimestamp(newTime);
    cell4.innerHTML = statusText;
}

function getTimeFromTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString("es-ES").slice(0, -3);
}