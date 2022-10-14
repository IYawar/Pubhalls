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

async function getdata(){
    const response = await fetch("https://a.vibot.tech:3002/api/afkchecks")
    const data = await response.json()
    
    document.getElementById('afk-test').textContent = afk
}
getdata()

setInterval(getdata, 3000)
console.log(getdata())