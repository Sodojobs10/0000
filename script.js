async function fetchTeams() {
    try {
        const response = await fetch('https://www.sofascore.com/api/v1/unique-tournament/132/season/65360/standings/total');
        const data = await response.json();
        
        const teams = data.standings[8].rows.map(row => row.team);
        
        const container = document.getElementById('teams-container');
        teams.forEach(team => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <a href="team.html?id=${team.id}">
                    <img src="https://img.sofascore.com/api/v1/team/${team.id}/image" alt="${team.name}">
                    <p>${team.name}</p><br>ID: ${team.id}
                </a>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao buscar dados dos Times NBA:', error);
    }
}

async function fetchPlayers() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');
    try {
        const response = await fetch(`https://api.sofascore.com/api/v1/team/${teamId}/players`);
        const data = await response.json();
        
        const players = data.players.map(player => player.player);
        
        const container = document.getElementById('players-container');
        
        players.forEach(player => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
            <a href="player.html?id=${player.id}">
                <img src="https://img.sofascore.com/api/v1/player/${player.id}/image" alt="${player.name}">
                <p>${player.name}</p><br>ID: ${player.id}
            </a>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao buscar jogadores do time selecionado:', error);
    }
}

async function fetchPlayerStatistics() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('id');
    try {
        const playerResponse = await fetch(`https://www.sofascore.com/api/v1/player/${playerId}`);
        const playerData = await playerResponse.json();
        const playerName = playerData.player.name;
        const teamName = playerData.player.team.name;
        const teamId = playerData.player.team.id;

        const playerContainer = document.getElementById('player-container');
        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');
        playerCard.innerHTML = `
            <div class="player">
                <div>
                    <img src="https://img.sofascore.com/api/v1/player/${playerId}/image" alt="${playerName}">
                </div>
                <div>
                    <h2>${playerName}</h2>
                    <p>${teamName}</p>
                    <img width="50" height="50" src="https://img.sofascore.com/api/v1/team/${teamId}/image" alt="${teamName}">
                </div>
            </div>
        `;
        playerContainer.appendChild(playerCard);

        const eventsResponse = await fetch(`https://www.sofascore.com/api/v1/player/${playerId}/events/last/0`);
        const eventsData = await eventsResponse.json();
        const events = eventsData.events.map(event => ({ id: event.id, timestamp: event.startTimestamp })).slice(-10)
        const eventsContainer = document.getElementById('events-container');

        let totalPontos = 0, totalRebotes = 0, totalAssistencias = 0;
        let totalTresPontos = 0, totalTentativasTresPontos = 0;
        
        let gamesData = [];
        
        for (const event of events) {
            const statisticsResponse = await fetch(`https://www.sofascore.com/api/v1/event/${event.id}/player/${playerId}/statistics`);
            const statisticsData = await statisticsResponse.json();
            const stats = statisticsData.statistics;

            totalPontos += stats.points;
            totalRebotes += stats.rebounds;
            totalAssistencias += stats.assists;
            totalTresPontos += stats.threePointsMade;
            totalTentativasTresPontos += stats.threePointAttempts;

            const timestamp = event.timestamp * 1000;
            const data = new Date(timestamp);
            const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric' };
            const dataFormatada = data.toLocaleDateString('pt-BR', options);

            gamesData.push({
                eventId: event.id,
                date: dataFormatada,
                pontos: stats.points,
                rebotes: stats.rebounds,
                assistencias: stats.assists,
                tresPontos: stats.threePointsMade,
                tentativasTresPonto: stats.threePointAttempts,
                porcentagemTresPontos: ((stats.threePointsMade/stats.threePointAttempts) * 100).toFixed(2)
            });        
        }        
            const mediaPontos = (totalPontos / 10).toFixed(2);
            const mediaRebotes = (totalRebotes / 10).toFixed(2);
            const mediaAssistencias = (totalAssistencias / 10).toFixed(2);
            const porcentagemTresPontos =  totalTentativasTresPontos > 0 
            ? ((totalTresPontos / totalTentativasTresPontos) * 100).toFixed(2)
            : '0';

            const chartsContainer = document.getElementById('charts-container');
            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-container');
            chartContainer.innerHTML = `<canvas id="performanceChart-${playerId}"></canvas>`;
            chartsContainer.appendChild(chartContainer);
            renderCharts(gamesData, playerId)


            const statisticsContainer = document.getElementById('statistics-container');
            const statsContainer = document.createElement('div');
            statsContainer.classList.add('statistics-container');
            statsContainer.innerHTML = `
                <div class="average">
                    <div>
                        <p>Pontos</p>
                        <p>${mediaPontos}</p>
                    </div>
                    <div>
                        <p>Rebotes</p>
                        <p>${mediaRebotes}</p>
                    </div>
                    <div>
                        <p>Assistências</p>
                        <p>${mediaAssistencias}</p>
                    </div>
                    <div>
                        <p>3 pontos</p>
                        <p>${totalTresPontos}/${totalTentativasTresPontos} (${porcentagemTresPontos}%)</p>
                    </div>
                </div>
            `;
            statisticsContainer.appendChild(statsContainer);
    
            eventsContainer.classList.add('events-container');
            gamesData.forEach(game => {
                const eventItem = document.createElement('div');
                eventItem.classList.add('game-card');
                eventItem.innerHTML = `
                <div>
                    <h4>Evento ID: ${game.eventId}</h4>
                    <p>Data: ${game.date}</p>
                    <p>Pontos: ${game.pontos}</p>
                    <p>Rebotes: ${game.rebotes}</p>
                    <p>Assistências: ${game.assistencias}</p>
                    <p>3 Pontos: ${game.tresPontos}/${game.tentativasTresPonto} (${game.porcentagemTresPontos}%)</p>
                </div>
                `;
                eventsContainer.appendChild(eventItem);
            });
    } catch (error) {
        console.error('Erro ao buscar estatisticas do jogador:', error);
    }
}

function renderCharts(gamesData, playerId) {
    const ctx = document.getElementById(`performanceChart-${playerId}`).getContext('2d');    
    const labels = gamesData.map((game) => `${game.date}`);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pontos',
                    data: gamesData.map(game => game.pontos),
                    borderColor: 'blue',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 20
                },
                {
                    label: 'Rebotes',
                    data: gamesData.map(game => game.rebotes),
                    borderColor: 'green',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 20
                },
                {
                    label: 'Assistências',
                    data: gamesData.map(game => game.assistencias),
                    borderColor: 'orange',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 20
                },
                {
                    label: 'Cestas de 3 pontos',
                    data: gamesData.map(game => game.tresPontos),
                    borderColor: 'red',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 20
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,  // Controla a proporção entre largura e altura
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Médias dos últimos 10 jogos',
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                subtitle: {
                    display: true,
                    text: 'NBA'
                }
            }
        }
    });
}

async function fetchAllPlayersStatistics() {
    try {
        const response1 = await fetch('https://www.sofascore.com/api/v1/unique-tournament/132/season/65360/standings/total');
        const data1 = await response1.json();
        const teams = data1.standings[8].rows.map(row => row.team);
        
        const container1 = document.getElementById('all-container');
        teams.forEach(team => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <a href="team.html?id=${team.id}">
                    <img src="https://img.sofascore.com/api/v1/team/${team.id}/image" alt="${team.name}">
                    <p>${team.name}</p><br>ID: ${team.id}
                </a>
            `;
            container1.appendChild(card);
        });

        let teamId = parseInt(prompt("Digite o ID do Time para Fazer a Análise de Todos Seus Jogadores!"), 10);
        if (!teamId == null) {
            return;
        }

        const response2 = await fetch(`https://api.sofascore.com/api/v1/team/${teamId}/players`);
        const data2 = await response2.json();
        const players = data2.players.map(player => player.player);

        const container = document.getElementById('allplayers-container');
        
        for (const player of players) {
            const playerSection = document.createElement('div');
            playerSection.classList.add('player-section');

            const playerResponse = await fetch(`https://www.sofascore.com/api/v1/player/${player.id}`);
            const playerData = await playerResponse.json();
            const playerName = playerData.player.name;
            const teamName = playerData.player.team.name;
            const teamId = playerData.player.team.id;

            const playerCard = document.createElement('div');
            playerCard.classList.add('player-card');
            playerCard.innerHTML = `
                <div class="player">
                    <div>
                        <img src="https://img.sofascore.com/api/v1/player/${player.id}/image" alt="${playerName}">
                    </div>
                    <div>
                        <h2>${playerName}</h2>
                        <p>${teamName}</p>
                        <img width="50" height="50" src="https://img.sofascore.com/api/v1/team/${teamId}/image" alt="${teamName}">
                    </div>
                </div>
            `;
            playerSection.appendChild(playerCard);

            const eventsResponse = await fetch(`https://www.sofascore.com/api/v1/player/${player.id}/events/last/0`);
            const eventsData = await eventsResponse.json();
            const events = eventsData.events.map(event => ({ id: event.id, timestamp: event.startTimestamp })).slice(-10);

            let totalPontos = 0, totalRebotes = 0, totalAssistencias = 0;
            let totalTresPontos = 0, totalTentativasTresPontos = 0;
            let gamesData = [];

            for (const event of events) {
                const statisticsResponse = await fetch(`https://www.sofascore.com/api/v1/event/${event.id}/player/${player.id}/statistics`);
                const statisticsData = await statisticsResponse.json();
                const stats = statisticsData.statistics;
            
                totalPontos += stats.points;
                totalRebotes += stats.rebounds;
                totalAssistencias += stats.assists;
                totalTresPontos += stats.threePointsMade;
                totalTentativasTresPontos += stats.threePointAttempts;

                const timestamp = event.timestamp * 1000;
                const data = new Date(timestamp);
                const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric' };
                const dataFormatada = data.toLocaleDateString('pt-BR', options);

                gamesData.push({
                    eventId: event.id,
                    date: dataFormatada,
                    pontos: stats.points,
                    rebotes: stats.rebounds,
                    assistencias: stats.assists,
                    tresPontos: stats.threePointsMade,
                    tentativasTresPonto: stats.threePointAttempts,
                    porcentagemTresPontos: ((stats.threePointsMade/stats.threePointAttempts) * 100).toFixed(2)
                });
            }

            const mediaPontos = (totalPontos / 10).toFixed(2);
            const mediaRebotes = (totalRebotes / 10).toFixed(2);
            const mediaAssistencias = (totalAssistencias / 10).toFixed(2);
            const porcentagemTresPontos = totalTentativasTresPontos > 0 ? ((totalTresPontos / totalTentativasTresPontos) * 100).toFixed(2) : '0';

            const statsContainer = document.createElement('div');
            statsContainer.classList.add('statistics-container');
            statsContainer.innerHTML = `
                <div class="average">
                    <div>
                        <p>Pontos</p>
                        <p>${mediaPontos}</p>
                    </div>
                    <div>
                        <p>Rebotes</p>
                        <p>${mediaRebotes}</p>
                    </div>
                    <div>
                        <p>Assistências</p>
                        <p>${mediaAssistencias}</p>
                    </div>
                    <div>
                        <p>3 pontos</p>
                        <p>${totalTresPontos}/${totalTentativasTresPontos} (${porcentagemTresPontos}%)</p>
                    </div>
                </div>
            `;
            playerSection.appendChild(statsContainer);

            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-container');
            chartContainer.innerHTML = `<canvas id="performanceChart-${player.id}""></canvas>`;
            playerSection.appendChild(chartContainer);

            const eventsContainer = document.createElement('div');
            eventsContainer.classList.add('events-container');
            gamesData.forEach(game => {
                const eventItem = document.createElement('div');
                eventItem.classList.add('game-card');
                eventItem.innerHTML = `
                <div>
                    <h4>Evento ID: ${game.eventId}</h4>
                    <p>Data: ${game.date}</p>
                    <p>Pontos: ${game.pontos}</p>
                    <p>Rebotes: ${game.rebotes}</p>
                    <p>Assistências: ${game.assistencias}</p>
                    <p>3 Pontos: ${game.tresPontos}/${game.tentativasTresPonto} (${game.porcentagemTresPontos}%)</p>
                </div>
                `;
                eventsContainer.appendChild(eventItem);
            });
            playerSection.appendChild(eventsContainer);
            container.appendChild(playerSection);
            renderCharts(gamesData, player.id)
        }
    } catch (error) {
        console.error('Erro ao buscar dados dos Times NBA:', error);
    }
}

fetchTeams();
fetchPlayers();
fetchPlayerStatistics();
fetchAllPlayersStatistics();
renderCharts(gamesData, playerId);