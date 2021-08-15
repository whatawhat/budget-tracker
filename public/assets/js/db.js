let db;
//Create a database request
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(e) {
    const db = e.target.result;
    //object store called pending with auto increment set
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (e) {
    db = e.target.result;
    //checks if online and if online, check the database
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(e) {
    console.log("Uh oh!" + e.target.errorCode);
};

function saveRecord(record) {
    //creates transaction on pending database with read write access
    const transaction = db.transaction (["pending"], "readwrite");
    //access pending object store
    const store = transaction.objectStore("pending");
    //adds record to store using the add method
    store.add(record);
}

function checkDatabase() {
    //open transaction on pending database
    const transaction = db.transaction(["pending"], "readwrite");
    //accesses pending object store
    const store = transaction.objectStore("pending");
    //gets all records from store
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0 ) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                //if successful, open a transaction on pending database with read write access
                const transaction = db.transaction(["pending"], "readwrite");
                //access pending object store
                const store = transaction.objectStore("pending");
                //clears all item in the store
                store.clear();
            });

        }
    };
}

//listens for online status for app
window.addEventListener("online", checkDatabase);