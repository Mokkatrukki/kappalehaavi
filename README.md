### Step 1: Create the Project Directory

Open your terminal and run the following commands to create the project directory and necessary files:

```bash
# Create the main project directory
mkdir kappalehaavi

# Navigate into the project directory
cd kappalehaavi

# Create the necessary subdirectories
mkdir css js images

# Create the manifest file
touch manifest.json

# Create the HTML file for the popup
touch popup.html

# Create the main CSS file
touch css/styles.css

# Create the main JavaScript file
touch js/popup.js

# Create the background script file
touch js/background.js
```

### Step 2: Set Up the Manifest File

Open `manifest.json` and add the following content:

```json
{
  "manifest_version": 3,
  "name": "kappalehaavi",
  "version": "1.0",
  "description": "Search and display songs from yle.fi",
  "permissions": [
    "activeTab"
  ],
  "background": {
    "service_worker": "js/background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["*://yle.fi/*"],
      "js": ["js/content.js"]
    }
  ],
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  }
}
```

### Step 3: Create the Popup HTML

Open `popup.html` and add the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/styles.css">
    <title>Kappalehaavi</title>
</head>
<body>
    <div id="search-container">
        <input type="text" id="search-input" placeholder="Search songs...">
        <button id="search-button">Search</button>
    </div>
    <div id="results-container"></div>
    <script src="js/popup.js"></script>
</body>
</html>
```

### Step 4: Add CSS Styles

Open `css/styles.css` and add some basic styles:

```css
body {
    font-family: Arial, sans-serif;
    width: 300px;
}

#search-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

#results-container {
    max-height: 400px;
    overflow-y: auto;
}

.collapsible {
    background-color: #f1f1f1;
    color: #444;
    cursor: pointer;
    padding: 10px;
    width: 100%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 15px;
}

.content {
    padding: 0 18px;
    display: none;
    overflow: hidden;
    background-color: #f9f9f9;
}
```

### Step 5: Implement JavaScript Logic

Open `js/popup.js` and add the following code to handle the search functionality and display results:

```javascript
document.getElementById('search-button').addEventListener('click', function() {
    const query = document.getElementById('search-input').value;
    // Here you would implement the logic to fetch data from yle.fi
    // For demonstration, we will use a static example
    const exampleData = [
        {
            title: "Eurodancesta Dubsteppiin!",
            date: "la 1.2.2025",
            songs: [
                { artist: "Catching Cairo, LZee & Bastion", title: "Open Season" },
                { artist: "SpettBros", title: "Taksil Tultii Tupaa ft. Junkkataxi" }
            ]
        },
        {
            title: "Taksilla tullaan, junkalla mennään!",
            date: "la 25.1.2025",
            songs: [
                { artist: "Skepsis & Doktor", title: "Arctic" },
                { artist: "Repair", title: "Hot For A Minute" }
            ]
        }
    ];

    displayResults(exampleData);
});

function displayResults(data) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

    data.forEach(item => {
        const collapsible = document.createElement('button');
        collapsible.className = 'collapsible';
        collapsible.innerText = `${item.title} - ${item.date}`;
        
        const content = document.createElement('div');
        content.className = 'content';
        
        item.songs.forEach(song => {
            const songItem = document.createElement('p');
            songItem.innerText = `${song.artist} - ${song.title}`;
            content.appendChild(songItem);
        });

        collapsible.addEventListener('click', function() {
            this.classList.toggle('active');
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });

        resultsContainer.appendChild(collapsible);
        resultsContainer.appendChild(content);
    });
}
```

### Step 6: Background Script (Optional)

You can implement any background logic in `js/background.js`. For now, you can leave it empty or add any necessary functionality later.

### Step 7: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click on "Load unpacked" and select the `kappalehaavi` directory.

### Step 8: Test the Extension

Click on the extension icon in the Chrome toolbar to open the popup. You should see the search input and button. When you click the search button, it will display the example songs in a collapsible format.

### Conclusion

You have successfully created a basic Chrome extension named "kappalehaavi" that allows searching and displaying songs in a collapsible format. You can further enhance the functionality by implementing the actual search logic to fetch data from the yle.fi page.