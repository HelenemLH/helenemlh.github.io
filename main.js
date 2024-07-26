document.getElementById("searchbartext").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        findMovie();
    }
});

const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzM2QyZWE4ODAyOWQwNzA1YWU2NDIyOTQwMmZiNWZmOCIsIm5iOiIxOTY3NjM1NzI3LjAyIiwic3ViIjoiNDAwZTg0OWEtZDY0Yy00OGEyLWIxMGQtYTgyOWI3ZmE2YjUwIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.BgPpOq-1Id2Vgr8E5nZ_iXGXeJ-9kMSBRyxhjzWoqmc';
const API_URL = 'https://api.themoviedb.org/3';
const CORS_PROXY = 'https://corsproxy.io/?';

async function fetchApiTmdb(imdbid) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    };
    const response = await fetch(`${API_URL}/find/tt${imdbid}?external_source=imdb_id`, options);
    const data = await response.json();
    const movieResult = data.movie_results[0];

    return movieResult ? { posterUrl: `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` } : null;
}

const mockyUrl = 'https://run.mocky.io/v3/8523e1bf-9da2-4b7b-93e8-bb82825682e9';

async function fetchApi(imdbid, movieElement) {
    const response = await fetch(mockyUrl);
    const data = await response.json();
    const film = data.find(film => film.imdbid === imdbid);

    if (film) {
        const { title, year, rating } = film;
        movieElement.querySelector(".title").textContent = title;
        movieElement.querySelector(".year").textContent = year;
        movieElement.querySelector(".rating").innerHTML = generateStars(rating);
    }
}

async function findMovie() {
    const searchbartext = document.getElementById("searchbartext").value;
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${searchbartext}`;
    const response = await fetch(url);
    const data = await response.json();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";
    for (const movie of data) {
        const movieElement = createMovieElement();
        resultsContainer.appendChild(movieElement);
        await fetchApi(movie.imdbid, movieElement);
        const tmdbData = await fetchApiTmdb(movie.imdbid);
        if (tmdbData) {
            movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
            movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${movie.imdbid}`;
        } else {
            movieElement.remove();
        }
    }
}

function createMovieElement() {
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie");
    movieElement.innerHTML = `
        <div class="title"></div>
        <div class="year"></div>
        <div class="rating"></div>
        <a class="poster-link" href="" target="_blank"><img class="movie-poster" src="" alt="Movie Poster"/></a>
    `;
    return movieElement;
}

function generateStars(rating) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    const starColor = '#FFD700';
    return `<span style="color: ${starColor};">${fullStar.repeat(rating) + emptyStar.repeat(3 - rating)}</span>`;
}

async function fetchAllMovies() {
    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getAllMovies`;
    const response = await fetch(url);
    return response.json();
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function getRandomMovie() {
    const allMovies = await fetchAllMovies();
    const filteredMovies = allMovies.filter(movie => movie.year >= 1995 && movie.year <= 2025);

    if (filteredMovies.length === 0) {
        alert("No movies available for the selected years");
        return;
    }

    const randomMovie = getRandomItem(filteredMovies);

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const movieElement = createMovieElement();
    resultsContainer.appendChild(movieElement);

    await fetchApi(randomMovie.imdbid, movieElement);
    const tmdbData = await fetchApiTmdb(randomMovie.imdbid);
    if (tmdbData) {
        movieElement.querySelector(".movie-poster").src = tmdbData.posterUrl;
        movieElement.querySelector(".poster-link").href = `https://www.imdb.com/title/tt${randomMovie.imdbid}`;
    } else {
        movieElement.remove();
    }
}

let threeStarMovies = [];
let currentPage = 1;
const moviesPerPage = 4;

async function fetchThreeStarMovies() {
    const allMovies = await fetchAllMovies();
    threeStarMovies = allMovies.filter(movie => movie.rating === 3 && movie.year >= 1995 && movie.year <= 2024);
    displayPage(1);
}

function applyFilters(movies, filters) {
    return movies.filter(movie => {
        const matchesYear = filters.year ? movie.year === filters.year : true;
        return matchesYear;
    });
}

function displayPage(page, filters = {}) {
    currentPage = page;
    let filteredMovies = applyFilters(threeStarMovies, filters);
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const moviesToDisplay = filteredMovies.slice(startIndex, endIndex);

    const suggestionsContainer = document.getElementById("suggestions-list");
    suggestionsContainer.innerHTML = "";

    for (const movie of moviesToDisplay) {
        fetchApiTmdb(movie.imdbid).then(tmdbData => {
            if (tmdbData) {
                const suggestionElement = document.createElement("div");
                suggestionElement.classList.add("suggestion-item");
                suggestionElement.innerHTML = `
                    <a href="https://www.imdb.com/title/tt${movie.imdbid}" target="_blank" class="suggestion-link">
                        <img src="${tmdbData.posterUrl}" alt="${movie.title} Poster" class="suggestion-poster"/>
                        <div class="title">${movie.title}</div>
                        <div class="year">${movie.year}</div>
                        <div class="rating">${generateStars(movie.rating)}</div>
                    </a>
                `;
                suggestionsContainer.appendChild(suggestionElement);
            }
        });
    }

    displayPagination(filteredMovies.length, filters);
}

function displayPagination(totalMovies, filters) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    const maxPagesToShow = 20;
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pagination-button");
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => displayPage(i, filters));
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.classList.add("pagination-button");
    if (currentPage === totalPages) {
        nextButton.disabled = true;
    }
    nextButton.addEventListener("click", () => displayPage(currentPage + 1, filters));
    paginationContainer.appendChild(nextButton);

    if (endPage < totalPages) {
        const lastButton = document.createElement("button");
        lastButton.innerText = "Last";
        lastButton.classList.add("pagination-button");
        lastButton.addEventListener("click", () => displayPage(totalPages, filters));
        paginationContainer.appendChild(lastButton);
    }
}

document.getElementById("filter-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const year = parseInt(document.getElementById("year").value, 10);
    const filters = { year };
    displayPage(1, filters);
});

async function showSuggestions() {
    const query = document.getElementById("searchbartext").value;
    if (query.length < 3) {
        document.getElementById("suggestions-dropdown").innerHTML = "";
        return;
    }

    const url = `${CORS_PROXY}https://bechdeltest.com/api/v1/getMoviesByTitle?title=${query}`;
    const response = await fetch(url);
    const data = await response.json();

    const suggestionsDropdown = document.getElementById("suggestions-dropdown");
    suggestionsDropdown.innerHTML = "";

    data.slice(0, 5).forEach(movie => {
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.textContent = `${movie.title} (${movie.year})`;
        suggestionItem.addEventListener("click", () => {
            document.getElementById("searchbartext").value = movie.title;
            suggestionsDropdown.innerHTML = "";
            findMovie();
        });
        suggestionsDropdown.appendChild(suggestionItem);
    });
}

fetchThreeStarMovies();
