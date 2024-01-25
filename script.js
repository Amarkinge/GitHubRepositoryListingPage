var baseApiUrl = 'https://api.github.com/users/';
const perPage = 10;
const currentPage = 1;
var searchUserButton = document.getElementById('getUserNameButton');
var selectPerPage = document.getElementById('perPage');
var searchRepositoryInput = document.getElementById('searchRepo');

searchUserButton.addEventListener('click', function () {
    try
    {
    let githubUsername = $('#username').val().toString();
    if(githubUsername.trim() === "")
    {
       throw 'Empty';
    }

    let profileApiUrl = baseApiUrl + githubUsername;
    //var reposApiUrl = profileApiUrl + '/repos';
    localStorage.setItem('profileApiUrl', profileApiUrl);
    localStorage.setItem('reposApiUrl', (profileApiUrl + '/repos'));
    localStorage.setItem('perPage', perPage);
    localStorage.setItem('currentPage', currentPage);
    fetchProfile();
    fetchRepositories();
    }
    catch (error)
    {
        console.error("Error while searching GitHub user."+ JSON.stringify(error));
        return $('#profile-container').html(`<div class="text-success" role="status">
        <span class="text-danger">Input should not be Empty.</span>
      </div>`);
    }
});

selectPerPage.addEventListener('change', function () {
    localStorage.setItem('perPage', selectPerPage.value);
    localStorage.setItem('currentPage', currentPage);
    fetchRepositories();
});

searchRepositoryInput.addEventListener('input', function () {
    var searchValue = searchRepositoryInput.value;
    filterRepositories(searchValue);
})


function fetchProfile() {
    $('#profile-container').html(`<div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`);

    var profileApiUrl = localStorage.getItem('profileApiUrl');
    $.ajax({
        url: profileApiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (profile) {
            try
            {
                displayProfile(profile);
            }
            catch(error)
            {
                return;
            }
        },
        error: function (error) {
            console.error(JSON.stringify(error));
            if (parseInt(error.readyState) == 4) {
                var response = error.responseJSON;
                $('#profile-container').html(`<div class="d-flex justify-content-center">
                <div role="status">
                    <h2 class="text-danger">Error while loading profile:</h2>
                    <p>Message: ${response.message}</p>
                    <p>Document: <a href="${response.documentation_url}" target="_blank">${response.documentation_url}</a></p>
                </div>
              </div>`);
            }
            else {
                $('#profile-container').html(`<div class="d-flex justify-content-center">
                <div class="spinner-border text-danger" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>`);
            }

        }
    });
}

function fetchRepositories() {
    $('#repositories-container').html(`<div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`);
    var reposApiUrl = localStorage.getItem('reposApiUrl');
    var perPage = localStorage.getItem('perPage');
    var currentPage = localStorage.getItem('currentPage');
    $.ajax({
        url: reposApiUrl,
        method: 'GET',
        data: {
            per_page: perPage,
            page: currentPage
        },
        dataType: 'json',
        success: function (repositories, textStatus, xhr) {
            var linkHeader = xhr.getResponseHeader('Link');
            var totalPages = linkHeader ? extractTotalPages(linkHeader) : 1;
            localStorage.setItem('totalPages', totalPages);
            displayRepositories(repositories);
            displayPagination();
        },
        error: function (error) {
            console.error(JSON.stringify(error));
            if (parseInt(error.readyState) == 4) {
                var response = error.responseJSON;
                $('#repositories-container').html(`<div class="d-flex justify-content-center">
                <div role="status">
                    <h2 class="text-danger">Error while loading repositories:</h2>
                    <p>Message: ${response.message}</p>
                    <p>Document: <a href="${response.documentation_url}" target="_blank">${response.documentation_url}</a></p>
                </div>
              </div>`);
            }
            else {
                $('#repositories-container').html(`<div class="d-flex justify-content-center">
                <div class="spinner-border text-danger" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>`);
            }
        }
    });
}

function extractTotalPages(linkHeader) {
    var matches = linkHeader.match(/&page=(\d+)>; rel="last"/);
    return matches ? parseInt(matches[1]) : 1;
}

function displayProfile(profile) {
    var container = $('#profile-container');
    container.empty();
    const notAvailable = 'Not Available';
    if (profile != null) {
        let twitterLink = '';
        let twitterUsername = profile.twitter_username;
        let profileName = profile.name;
        let profileBio = profile.bio;
        let profileLocation  = profile.location;
        let gihubPortalLink = profile.html_url;
        let gihubPortal = profile.html_url;

        if(profileName == null)
        {
            profileName = notAvailable;
        }

        if(profileBio == null)
        {
            profileBio = notAvailable;
        }

        if(profileLocation == null)
        {
            profileLocation = notAvailable;
        }

        if(gihubPortalLink == null)
        {
            gihubPortal=notAvailable;
            gihubPortalLink = '#'
        }

        if (twitterUsername == null) {

            twitterLink = '#';
            twitterUsername = notAvailable;
        }
        else{
            twitterLink = 'https://twitter.com/' + profile.twitter_username;
        }
        var repoOwner = `<div class="row">
                            <div class="col-2">  
                                <img src="${profile.avatar_url}" class="img-thumbnail rounded-circle rounded profile-img" alt="Profile picture">
                            </div>
                            <div class="col-8">
                                <h1 class="profile-name"><i class="fa fa-user"></i> ${profileName}</h1>
                                <p class="profile-bio">${profileBio}</p>
                                <p class="profile-location"><i class="fa-solid fa-location-dot"></i> ${profileLocation}</p>
                                <a class="twitter-link" target="_blank" href="${twitterLink}"><i class="fa fa-twitter"></i> ${twitterUsername}</a>
                            </div>
                        </div>
                        <div class="row">
                            <p>
                            <a href="${gihubPortalLink}" target="_blank" class="profile-link"><i class="fa-solid fa-link"></i></a>
                            <span>${gihubPortal}<span>
                            </p>
                        </div>`;

        container.append(repoOwner);
    }
    else {
        container.html('<p class="loading">No profile found.</p>');
    }

}

function displayRepositories(repositories) {

    var container = $('#repositories-container');
    container.empty();

    if (repositories.length > 0) {
        $.each(repositories, function (index, repo) {
            var description = "-";
            if (repo.description != null) {
                description = repo.description;
            }
            var topicsHTML = repo.topics.map(topic => `<span class="tag m-1 mt-1">${topic}</span>`).join('');
            var repoHTML = `<div class="card bg-light" id="repository" style="width: 40rem;">
                            <div class="card-body">
                              <h5 class="card-title"><b>${repo.name}</b></h5>
                              <p class="card-text">${description}.</p>
                              <div class="m-1">${topicsHTML}</div>
                              <a href="${repo.html_url}" target="_blank" class="btn btn-info btn-sm">View on GitHub</a>
                            </div>
                          </div>`;
            container.append(repoHTML);
        });
    } else {
        container.html('<p class="loading">No repositories found.</p>');
    }
}

//Method to display Pagination from server side.
function displayPagination() {
    var paginationContainer = $('#pagination-container');
    paginationContainer.empty();
    var totalPages = parseInt(localStorage.getItem('totalPages'));
    var activePage = parseInt(localStorage.getItem('currentPage'));
    var pageIndex = 1;
    var maxPageItems = 9;
    if (totalPages > 1) {

        var paginationHTML = `<b>Page:<b><nav aria-label="...">
                            <ul class="pagination">
                                    <li class="page-item">
                                        <a class="page-link" href="#" aria-label="Previous" onclick="changePage(event)" data-value="Prev">
                                            <span aria-hidden="true">&laquo;</span>
                                        </a>
                                    </li>`;

        if(activePage > maxPageItems)
        {
            if(totalPages > maxPageItems)
            {
                
                for(pageIndex = pageIndex + (activePage - maxPageItems); pageIndex <= activePage; pageIndex++)
                {
                    if (activePage == pageIndex) {
                        paginationHTML += `<li class="page-item active">
                                            <a class="page-link" aria-current="page" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                    else {
                        paginationHTML += `<li class="page-item">
                                            <a class="page-link" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                }
            }
        }
        else{
            if (totalPages > maxPageItems) {
                for (pageIndex = 1; pageIndex <= maxPageItems; pageIndex++) {
    
                    if (activePage == pageIndex) {
                        paginationHTML += `<li class="page-item active">
                                            <a class="page-link" aria-current="page" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                    else {
                        paginationHTML += `<li class="page-item">
                                            <a class="page-link" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                }
            }
            else {
                for (pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
                    if (activePage == pageIndex) {
                        paginationHTML += `<li class="page-item active">
                                        <a class="page-link active" aria-current="page" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                    else {
                        paginationHTML += `<li class="page-item">
                                        <a class="page-link" id="page${pageIndex}" onclick="changePage(event)" data-value="${pageIndex}"  href="#">${pageIndex}</a>
                                        </li>`;
                    }
                }
            }
        }

        paginationHTML += `<li class="page-item">
                                <a class="page-link" href="#" aria-label="Next" onclick="changePage(event)" data-value="Next">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul></nav>`;

        paginationContainer.html(paginationHTML);
    }
};

//Method to filter repositories
function filterRepositories(searchValue) {
    var repos = $('.card');
    repos.each(function () {
        var repo = $(this);
        var repoName = repo.find('h5').text().toLowerCase();
        var repoDescription = repo.find('p').text().toLowerCase();
        if (repoName.includes(searchValue.toLowerCase()) || repoDescription.includes(searchValue.toLowerCase())) {
            repo.show();
        } else {
            repo.hide();
        }

    });
}

//Method to change page from Pagination
function changePage(event) 
{
    event.preventDefault();
    var selectedLinkValue = event.target.getAttribute('data-value');
    var totalPages = parseInt(localStorage.getItem('totalPages'));
    if (selectedLinkValue != null) {

        if (selectedLinkValue.toString().toUpperCase() === 'PREV') {
            let pageNumber = parseInt(localStorage.getItem('currentPage'));
            if (pageNumber > 1) {
                pageNumber = pageNumber - 1;
                localStorage.setItem('currentPage', pageNumber);
                return fetchRepositories();
            }
        }
        else if (selectedLinkValue.toString().toUpperCase() === 'NEXT') {
            let pageNumber = parseInt(localStorage.getItem('currentPage'));
            if (pageNumber < totalPages) {
                pageNumber = pageNumber + 1;
                localStorage.setItem('currentPage', pageNumber);
                return fetchRepositories();
            }
        }
        else {
            localStorage.setItem('currentPage', parseInt(selectedLinkValue));
            fetchRepositories();
        }
    }

}

