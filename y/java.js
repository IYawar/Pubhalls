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
console.log("y")
let afk = document.getElementById("afk")
let run = document.getElementById("run")
let safk = document.getElementById("safk")
let srun = document.getElementById("srun")
let boxes = document.getElementsByClassName("rbox")
async function leggo() {
    let activeAfk = [],activeRun = []
    let data = await getdata()
    
    for (let i of Object.values(data)) {
        if ( i.leader != null){
        if (i.active === false) activeRun.push(i)
        else activeAfk.push(i)
        }
    }
     afk.innerHTML = ""
     safk.innerHTML = ""
     run.innerHTML = ""
     srun.innerHTML = ""
    activeAfk.forEach(rAfk => RenderAfk(rAfk))
    activeRun.forEach(rRun => RenderRun(rRun))
    activeAfk.forEach(rAfk => sRenderAfk(rAfk))
    activeRun.forEach(rRun => sRenderRun(rRun))


// function RenderAfk(afkCheck) {
//     if (afkCheck.started) started = Math.abs((Date.now() - afkCheck.started) / 1000)
//     let afkTang = document.createElement("div")
//     afkTang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox" style= "background : linear-gradient(90deg, ${afkCheck.runType.embed.color}, black) !important;")><p class="left"><strong>${afkCheck.runType.runName}</strong> by <strong>${afkCheck.leaderNick}</strong></p><p class="mid">${Math.floor(afkCheck.timeLeft / 60) || 0}:${Math.round(afkCheck.timeLeft % 60) || 00}</p><p class="right">${afkCheck.vcSize || '0'}/${afkCheck.runType.vcCap || '0'}</p></div></a>`//${afkCheck.runType.vcCap || '0'}
//     afk.append(afkTang) 
// }
// function RenderRun(afkCheck){

//     let runTang = document.createElement("div")
//     let timeSince = Math.abs((Date.now() - afkCheck.endedAt) / 1000)
//     runTang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox" style= "background : linear-gradient(90deg, ${afkCheck.runType.embed.color}, black) !important;"><p class="left" ><strong>${afkCheck.runType.runName}</strong> by <strong>${afkCheck.leaderNick}</strong></p><p class="right">~~since ${Math.floor(timeSince / 60) || '0'}m ${Math.round(timeSince % 60) || '0'}s</p></div></a>`;
//     run.append(runTang)

// }
// function sRenderAfk(afkCheck) {
//     if (afkCheck.started) started = Math.abs((Date.now() - afkCheck.started) / 1000)
//     let safkTang = document.createElement("div")
//     safkTang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox" style= "background : linear-gradient(90deg, ${afkCheck.runType.embed.color}, black) !important;"><p class="left"><strong>${afkCheck.runType.runName}</strong> by <strong>${afkCheck.leaderNick}</strong></p><p class="mid">${Math.floor(afkCheck.timeLeft / 60) || 0}:${Math.round(afkCheck.timeLeft % 60) || 00}</p><p class="right">${afkCheck.vcSize || '0'}/${afkCheck.runType.vcCap || '0'}</p></div></a>`//${afkCheck.runType.vcCap || '0'}
//     safk.append(safkTang)
// }
// function sRenderRun(afkCheck){

//     let srunTang = document.createElement("div")
//     let timeSince = Math.abs((Date.now() - afkCheck.endedAt) / 1000)
//     srunTang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox" style= "background : linear-gradient(90deg, ${afkCheck.runType.embed.color}, black) !important;"><p class="left"><strong>${afkCheck.runType.runName}</strong> by <strong>${afkCheck.leaderNick}</strong></p><p class="right">~since ${Math.floor(timeSince / 60) || '0'}m ${Math.round(timeSince % 60) || '0'}s ago</p></div></a>`;
//     srun.append(srunTang)
// }
// }setInterval(leggo, 3000)
// console.log("y")
}