document.addEventListener("DOMContentLoaded",()=>{
    const viewer=document.getElementById("viewer");
    const buttons=document.querySelectorAll(".nav-btn");
    const footer=document.querySelector(".footer p");
  
    buttons.forEach(btn=>{
      btn.addEventListener("click",()=>{
        const page=btn.getAttribute("data-page");
        viewer.src=page;
  
        buttons.forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
  
        footer.textContent=`Now viewing: ${btn.textContent}`;
      });
    });
  
    // Theme toggle
    const themeBtn=document.querySelector(".actions .btn");
    themeBtn.addEventListener("click",()=>{
      document.body.classList.toggle("light");
    });
  });