const toggleButton = document.querySelector('.toggle-button');
const navigationMenu = document.querySelector('.navigation-menu');

if (toggleButton && navigationMenu) {
    toggleButton.addEventListener('click', () => {
        navigationMenu.classList.toggle('active');
        toggleButton.classList.toggle('active');
    });
}


const scrollButton = document.querySelector('.scroll-top-btn');

if (scrollButton) {
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
}


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

function updateCounter() {
    if (count <= MaxCount) {
        counter.textContent = count;

        if (count === 10) {
            applyResponsiveStyles(10);
        } else {
            applyResponsiveStyles(count);
        }

        count++;
    } else {
        clearInterval(interval);
    }
}

function applyResponsiveStyles(currentValue) {
    let width = window.innerWidth;
    let isTen = currentValue === 10;

    if (width <= 310) {
        if (isTen) {
            counter.style.paddingLeft = '30px';
            plus.style.paddingLeft = '5px';
        } 
        
        else {
            counter.style.paddingLeft = '40px';
            plus.style.paddingLeft = '11px';
        }
    } 
    
    else if (width <= 350) {
        if (isTen) {
            counter.style.paddingLeft = '33px';
            plus.style.paddingLeft = '5px';
        } 
        
        else {
            counter.style.paddingLeft = '43px';
            plus.style.paddingLeft = '14px';
        }
    } 
    
    else if (width <= 400) {
        if (isTen) {
            counter.style.paddingLeft = '37px';
            plus.style.paddingLeft = '5px';
        } 
        
        else {
            counter.style.paddingLeft = '47px';
            plus.style.paddingLeft = '12px';
        }
    } 
    
    else if (width <= 450) {
        if (isTen) {
            counter.style.paddingLeft = '39px';
            plus.style.paddingLeft = '4px';
        } 
        
        else {
            counter.style.paddingLeft = '49px';
            plus.style.paddingLeft = '14px';
        }

    }     

    else if (width <= 550) {
        if (isTen) {
            counter.style.paddingLeft = '40px';
            plus.style.paddingLeft = '4px';
        } 
        
        else {
            counter.style.paddingLeft = '52px';
            plus.style.paddingLeft = '14px';
        }

    } 
    
    else if (width <= 600) {
        if (isTen) {
            counter.style.paddingLeft = '40px';
            plus.style.paddingLeft = '4px';
        } 
        
        else {
            counter.style.paddingLeft = '52px';
            plus.style.paddingLeft = '12px';
        }
    } 
    
    else if (width <= 800) {
        if (isTen) {
            counter.style.paddingLeft = '43px';
            plus.style.paddingLeft = '5px';
        } 
        
        else {
            counter.style.paddingLeft = '53px';
            plus.style.paddingLeft = '13px';
        }
    } 
    
    else if (width <= 860) {
        if (isTen) {
            counter.style.paddingLeft = '44px';
            plus.style.paddingLeft = '5px';
        } 
        
        else {
            counter.style.paddingLeft = '61px';
            plus.style.paddingLeft = '20px';
        }
    }

     else if (width <= 960) {
        if (isTen) {
            counter.style.paddingLeft = '45px';
            plus.style.paddingLeft = '5px';
        } 
        else {
            counter.style.paddingLeft = '58px';
            plus.style.paddingLeft = '18px';
        }
    } 

    else {
        if (isTen) {
            counter.style.paddingLeft = '48px';
            plus.style.paddingLeft = '6px';
        } 
        
        else {
            counter.style.paddingLeft = '63px';
            plus.style.paddingLeft = '18px';
        }
    }
}


let interval = setInterval(updateCounter, 300);


window.addEventListener('resize', function () {
    let currentValue = Math.min(count - 1, MaxCount);
    applyResponsiveStyles(currentValue);
});


const modal = document.getElementById("modal");
const tabs = document.querySelectorAll(".tab");
const LGNForm = document.getElementById("log-in-form");
const SGNForm = document.getElementById("sign-up-form");
const closeBtn = document.querySelector(".close-btn");

if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

function activateTab(type) {
    tabs.forEach(tab => tab.classList.remove("active"));
    LGNForm.classList.remove("active");
    SGNForm.classList.remove("active");

    if (type === "login") {
        document.querySelector('[data-tab="login"]').classList.add("active");
        LGNForm.classList.add("active");
    }

    if (type === "sign-up") {
        document.querySelector('[data-tab="sign-up"]').classList.add("active");
        SGNForm.classList.add("active");
    }
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        activateTab(tab.dataset.tab);
    });
});

const openLoginBtn = document.getElementById("openLogIn");
if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        activateTab("login");
    });
}

const openSignupBtn = document.getElementById("openSignUp");
if (openSignupBtn) {
    openSignupBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        activateTab("sign-up");
    });
}

const SUPABASE_URL = "https://kklayfqcsrbghzctlncv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wC_LPUaxGzVbPJHw1ZEj-A_QKABj_BZ";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

SGNForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const username = document.getElementById("signup-username").value;
    const birth_date = document.getElementById("signup-date").value;

    const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
            email,
            password
        });

    if (signUpError) {
        alert("Chyba: " + signUpError.message);
        return;
    }

    const { error: profileError } = await supabase
        .from("profiles")
        .insert([
            {
                id: signUpData.user.id,
                username: username,
                birth_date: birth_date
            }
        ]);

    if (profileError) {
        alert("Chyba při ukládání profilu: " + profileError.message);
        return;
    }

    alert("Registrace proběhla! Zkontroluj email.");
});


LGNForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login chyba: " + error.message);
    } 
    
    else {
        alert("Přihlášení úspěšné!");
        modal.style.display = "none";

        window.location.href = "http://127.0.0.1:5173/dashboard";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
        console.log("Uživatel je přihlášen:", data.session.user.email);
    } else {
        console.log("Nikdo není přihlášen");
    }
});


