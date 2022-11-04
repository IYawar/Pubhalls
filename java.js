function droplist(){
    document.getElementById("mydroplist").classList.toggle("show")
}

window.onclick = function(event) {
    if(!event.target.matches('.dbut')){
        let drops = document.getElementsByClassName("drop-content");
        for(let i = 0; i < drops; i++){
            let openDropdown = drops[i];
            if (openDropdown.classList.contains('show')){
                openDropdown.classList.remove('show');
            }
        }
    }
}
let apiLink = "https://a.vibot.tech:3002/api/afkchecks"
async function getdata() {
    const response = await fetch("https://a.vibot.tech:3002/api/afkchecks")
    const data = await response.json()
    return data
}

window.onload = leggo
let runTang = document.createElement("div")
let afkTang = document.createElement("div")
let afk = document.getElementById("pend")
let run = document.getElementById("run")
let boxes = document.getElementsByClassName("rbox")
async function leggo() {
    let activeAfk = [],activeRun = []
    let data = await getdata()
    
    console.log(data)
    for (let i of Object.values(data)) {
        if (i.active === false) activeRun.push(i)
        else activeAfk.push(i)
        console.log(i.leaderNick)
        
    }
    activeAfk.forEach(rAfk => RenderAfk(rAfk))
    activeRun.forEach(rRun => RenderRun(rRun))


function RenderAfk(afkCheck) {

    if (afkTang === true) afk.removeChild(afkTang)
    afkTang.innerHTML += `<a href="${afkCheck.url}" target="_blank"><div class="rbox"><p class="left"> by ${afkCheck.leaderNick}</p><p class="mid">6:00</p><p class="right">${afkCheck.vcSize || '0'}/${afkCheck.runType.vcCap}</p></div></a>`
    afk.append(afkTang)
}
function RenderRun(afkCheck){
    if  (run.hasChildNodes) run.removeChild(run.parentNode)
    runTang.innerHTML += `<a href="${afkCheck.url}" target="_blank"><div class="rbox"><p class="left"> by ${afkCheck.leaderNick}</p><p class="mid">xx:xx</p><p class="right">something</p></div></a>`;
    run.append(runTang)
}
}setInterval(leggo, 3000)

//${afkCheck.runType.runName}
// } else {
    //     delete run.runTang
    //     runTang.innerHTML += `<a href="${afkCheck.url}" target="_blank"><div class="rbox"><p class="left"> by ${afkCheck.leaderNick}</p><p class="mid">xx:xx</p><p class="right">something</p></div></a>`;
    //     run.append(runTang)
    // }