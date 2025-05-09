const toggleButton = document.querySelector('.toggle-button');
const navigationMenu = document.querySelector('.navigation-menu');

toggleButton.addEventListener('click', () => {
    navigationMenu.classList.toggle('active');
    toggleButton.classList.toggle('active');
});


const scrollButton = document.querySelector('.scroll-top-btn');

scrollButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('scroll', () => {
    if (window.scrollY > 1000) {
        scrollButton.style.display = 'flex';
    } 
    
    else {
        scrollButton.style.display = 'none';
    }
});


function sendEmail() {
    const form = document.getElementById("contact-form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const templateParams = {
        name: document.querySelector(".FirstName").value,
        surname: document.querySelector(".LastName").value,
        email: document.querySelector(".emailFrom").value,
        subject: document.querySelector(".subject").value,
        message: document.querySelector(".message").value,
        reply_to: document.querySelector(".emailFrom").value,
    };

    emailjs
        .send("service_56z7jv1", "template_rwx7exl", templateParams)
        
        .then(() => {
            form.reset();
            document.querySelector(".contact-header").style.display = "none";
            document.querySelector(".contact-info").style.display = "none";
            document.querySelector(".contact-row").style.display = "none";
            document.querySelector(".success-container").style.display = "flex";
            document.querySelector(".button-container").style.display = "flex";
        })

        .catch(() => {
            alert("Email nebyl odeslán!!");
        });
}


let counter = document.querySelector('.counter-number');
let plus = document.querySelector('.counter-prefix');
let count = 1;
let MaxCount = 10;

function UpdaterCounter() {
    if (count <= MaxCount) {
        counter.textContent = count;

        if (count === 10) {
            counter.style.paddingLeft = '48px';
            plus.style.paddingLeft = '6px';
        } 
        
        else {
            counter.style.paddingLeft = '63px';
            plus.style.paddingLeft = '18px';
        }

        count++;
    } 
    
    else {
        clearInterval(interval);
    }
}

let interval = setInterval(UpdaterCounter, 300);
