class Board {
    constructor(DOMElement) {
        this.pools = [];
        this.selectedPool = null;
        this.DOMElement = DOMElement;
        let addTabButton = document.getElementById("addTabButton")
        addTabButton.onclick = () => {
            this.add(new Pool());
        }
        let drawButton = document.getElementById("drawButton")
        drawButton.onclick = () => {
            this.showEntry({label:""});
            this.showEntry(this.selectedPool.draw());
        }

        let newEntryButton = document.getElementById("plusButton");
        newEntryButton.onclick = () => {
            this.selectedPool.add(new Entry())
        }
    }
    add(pool) {
        this.pools.push(pool);
        this.createTab(pool);
        pool.parent = this;
        pool.save()
    }
    remove(pool) {
        let poolIndex = this.pools.indexOf(pool);
        console.log("removing ", this.pools[poolIndex])
        /*if (this.pools.length == 1) {
            this.pools[0].entries.map(entry => {
                console.log(entry)
                this.pools[0].remove(entry);
            })
            this.savePools();
            return;
        }*/
        this.removeTab(pool);
        this.pools.splice(poolIndex, 1);
        if (this.pools.length == 0) this.add(new Pool())
        let selectedPoolIndex = this.pools.indexOf(this.selectedPool);

        let clampedSelectedIndex = Math.max(0, Math.min(selectedPoolIndex, this.pools.length - 1))
        this.selectTab(this.pools[clampedSelectedIndex]);
        this.savePools();

    }
    showPool(pool) {
        let poolContainer = this.DOMElement.querySelector("#poolContainer");
        let originalPool = poolContainer.querySelector("#entryList");
        poolContainer.replaceChild(pool.DOMElement, originalPool);
        document.getElementById("poolHeading").querySelector("h2").innerText = "Pool " + (this.pools.indexOf(pool) + 1);
    }
    showEntry(entry) {
        console.log("showing entry:", entry)
        let drawnElement = document.getElementById("drawnLabel");
        if (entry) drawnElement.innerText = entry.label;
    }
    createTab(pool) {
        let tabsElement = this.DOMElement.querySelector("#tabs");
        let tab = document.createElement("div");
        let addTabButton = document.getElementById("addTabButton");
        pool.tabElement = tab;
        tab.innerText = this.pools.length;
        tabsElement.insertBefore(tab, addTabButton);
        this.selectTab(pool);
        if (this.pools.length == 9) addTabButton.style.display = "none";

        tab.onclick = () => {
            this.selectTab(pool);
        }
    }
    removeTab(pool) {
        pool.tabElement.remove()
        this.relabelTabs()
    }
    relabelTabs() {
        let tabsElement = document.getElementById("tabs");
        tabsElement.childNodes.forEach((tab, i) => {
            if (tab.id == "addTabButton") return;
            tab.innerText = i;
        })
    }
    selectTab(pool) {
        let previouslySelected = document.getElementById("selectedTab");
        if (previouslySelected) previouslySelected.id = "";
        pool.tabElement.id = "selectedTab";
        this.showPool(pool);
        this.selectedPool = pool;
    }
    savePools() {
        for (let i = 1; i <= 9; i++) {
            window.localStorage.removeItem("pool" + i)
        }
        let encodedString = "";
        this.pools.map(pool => {
            encodedString += pool.save() + "=";
        })
        encodedString = encodedString.slice(0, -1); // remove the last unecessary delimiter.
        return encodedString
    }
    loadPools(encodedString) {
        if (encodedString) {
            this.clearPools()
            let encodedPools = encodedString.split("=")
            encodedPools.map(poolString => {
                console.log(poolString)
                board.add(Pool.load(poolString))
            })
            this.remove(this.pools[0])
            //encodedString.
            return
        }
        for (let i = 1; i <= 9; i++) {
            let loadedPool = Pool.load(i)
            console.log(typeof loadedPool)
            if (typeof loadedPool == "object") this.add(loadedPool)
            if (this.pools.length == 0) this.add(new Pool())
        }
    }
    clearPools() {
        this.pools.slice().map(pool => this.remove(pool))
        //this.add(new Pool())
        this.showPool(this.pools[0])
    }
}

class Pool {
    constructor(entries = [], removeAfterDraw = false) {
        this.isRemoveAfterDraw = removeAfterDraw;
        this.lastDrawn = null;
        
        this.parent = null;
        this.DOMElement = document.createElement("ul");
        this.DOMElement.id = "entryList"
        this.tabElement = null

        this.entries = []
        entries.map(entry => this.add(entry));

        let removeAfterDrawCheckbox = document.getElementById("removeAfterDrawCheckbox")
        removeAfterDrawCheckbox.checked = this.isRemoveAfterDraw
        removeAfterDrawCheckbox.onclick = () => {
            this.isRemoveAfterDraw = removeAfterDrawCheckbox.checked;
        }
    }
    draw() {
        this.shuffle();
        let maxEntryNumber = this.getOccurences();
        let randomEntryNumber = Math.floor(Math.random() * (maxEntryNumber)) + 1;
        let currentEntryNumber = 0;
        console.log(currentEntryNumber, randomEntryNumber, maxEntryNumber)
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i].label) currentEntryNumber += this.entries[i].occurences;
            if (currentEntryNumber >= randomEntryNumber) {
                console.log(currentEntryNumber, randomEntryNumber, maxEntryNumber)
                let drawnEntry = this.entries[i];
                if (this.isRemoveAfterDraw) {
                    drawnEntry.occurences--;
                }
                this.save()
                if (drawnEntry.label == "") console.log("なんか？")
                return drawnEntry;
            }
        }
    }
    shuffle() {
        this.entries = this.entries
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
    }
    getOccurences() { return this.entries.reduce((a, b) => b.occurences && b.label ? a + b.occurences : a, 0) }
    add(entry) {
        this.entries.push(entry)
        if (this.parent) this.save()
        entry.parent = this;
        this.DOMElement.appendChild(entry.DOMElement);
        entry.labelInput.focus();
        let onEntryQuickAdd = e => {
            if (entry.labelInput.value == "") return;
            if (e.key == "Enter" && entry.DOMElement == this.DOMElement.lastChild) {
                this.add(new Entry());
                e.preventDefault()
                return
            }
        }

        let onChange = e => {
            entry.label = entry.labelInput.value;
            entry.occurences = parseInt(entry.occurenceInput.value);
            this.save()
        }
        entry.labelInput.onkeypress = onEntryQuickAdd;
        entry.labelInput.onchange = onChange;

        entry.occurenceInput.onkeypress = onEntryQuickAdd;
        entry.occurenceInput.onchange = onChange;
    }
    remove(entry) {
        this.entries.splice(this.entries.indexOf(entry), 1)
        if (this.parent) this.save()
        entry.DOMElement.remove()
    }
    save() {
        let poolIndex = this.parent.pools.indexOf(this);
        let encodedString = this.entries.reduce((string, entry) => {
            return entry.label == "" ? string : string + (entry.label + ":" + entry.occurences + "|");
        }, "");
        encodedString = encodedString.slice(0, -1); // remove the last unecessary delimiter.
        window.localStorage.setItem("pool" + (poolIndex + 1), encodedString);
        return encodedString;
    }
    static load(input) {
        let encodedString
        if (typeof input == "string") {
            encodedString = input
        } else if (typeof input == "number") {
            let index = input
            encodedString = window.localStorage.getItem("pool" + index);
        }
        if (!encodedString) return;
        let entryStrings = encodedString.split("|");
        let decodedEntries = entryStrings.map(item => {
            let entryPair = item.split(":");
            return new Entry(...entryPair);
        });
        return new Pool(decodedEntries);
    }
}

class Entry {
    constructor(label = "", occurences = 0) {
        this.label = label;
        this._occurences = occurences;
        this.parent = null;
        this.DOMElement = document.createElement("li");
        let column1 = document.createElement("td");
        this.labelInput = document.createElement("input");
        this.labelInput.type = "text";
        this.labelInput.value = label;
        this.labelInput.className = "label";
        //column1.appendChild(this.labelInput);
        let column2 = document.createElement("td");
        this.occurenceInput = document.createElement("input");
        this.occurenceInput.type = "number";
        this.occurenceInput.value = occurences;
        this.occurenceInput.min = "0";
        this.occurenceInput.max = "999";
        this.occurenceInput.className = "occurences";
        this.deleteButton = document.createElement("button");
        this.deleteButton.className = "delete";
        this.deleteButton.innerText = "✕";

        this.deleteButton.onclick = () => this.parent.remove(this);
        //column2.appendChild(this.occurenceInput);
        //let column3 = document.createElement("td");
        //column3.innerText = "x"
        this.DOMElement.appendChild(this.labelInput);
        this.DOMElement.appendChild(this.occurenceInput);
        this.DOMElement.appendChild(this.deleteButton);
        //this.DOMElement.appendChild(column3);
    }
    get occurences() {
        return this._occurences;
    }
    set occurences(value) {
        this._occurences = value;
        this.occurenceInput.value = value;
    }
}