function loadPage(page) {
    console.log(page)
    document.getElementById("contentFrame").src = page;

    // Close sidebar on mobile
    document.getElementById("sidebar").classList.remove("show");
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("show");
}