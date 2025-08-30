document.addEventListener('DOMContentLoaded', function() {
    const versesContainer = document.getElementById('verses-container');

    async function fetchVerses() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const verses = await response.json();
            displayVerses(verses);
        } catch (error) {
            displayErrorMessage();
            console.error('Failed to load verses:', error);
        }
    }

    function displayVerses(verses) {
        verses.forEach(verse => {
            // Create a container box for each verse
            const verseBox = document.createElement('div');
            verseBox.className = 'verse-box';

            // Create a button for the reference
            const button = document.createElement('button');
            button.textContent = verse.reference;
            button.className = 'verse-button';

            // Create a container for the verse text
            const verseText = document.createElement('div');
            verseText.textContent = verse.verse;
            verseText.className = 'verse-text';

            // Toggle verse text visibility on button click
            button.addEventListener('click', function() {
                const isVisible = verseText.style.display === 'block';
                verseText.style.display = isVisible ? 'none' : 'block';
            });

            // Append the button and verse text to the verse box
            verseBox.appendChild(button);
            verseBox.appendChild(verseText);

            // Append the verse box to the container
            versesContainer.appendChild(verseBox);
        });
    }

    function displayErrorMessage() {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Failed to load verses. Please try again later.';
        errorMessage.style.color = 'red';
        versesContainer.appendChild(errorMessage);
    }

    // Fetch and display verses on page load
    fetchVerses();
});
