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
async function leggo() {
    let activeAfk = [],activeRun = []
    let data = await getdata()
    console.log(data)
    for (let i of Object.values(data)) {
        if (i.active) activeRun.push(i)
        else activeAfk.push(i)
        RenderAfk(i, i.active)
        console.log(i.leaderNick)
        
    }
}
let rectang = document.createElement("div")
let afk = document.getElementById("pend")
let run = document.getElementById("run")

setInterval(leggo, 3000)
function RenderAfk(afkCheck, active) {
    if (active)  {
        delete rectang
        rectang.innerHTML = `<strong class='white'>Ayo mr ${afkCheck.leaderNick} check this out</strong>`;
        afk.append(rectang)
    } else {
        rectang.innerHTML = `<strong class='white'>Bruh by ${afkCheck.leaderNick} </strong>`;
        run.append(rectang)
    }
}
