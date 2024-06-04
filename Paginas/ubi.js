document.addEventListener('DOMContentLoaded', () => {
    // Função para buscar peças do backend e preencher o select de peças
    const fetchPecas = async () => {
        try {
            const response = await fetch('/pecas');
            const pecas = await response.json();
            const select = document.getElementById('pecasNecessarias');
            select.innerHTML = '';
            pecas.forEach(peca => {
                const option = document.createElement('option');
                option.value = peca._id;
                option.textContent = `${peca.nome} (Quantidade: ${peca.quantidade})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao buscar peças:', error);
        }
    };

    // Função para buscar estatísticas e renderizar gráficos
    const renderCharts = async () => {
        try {
            const pecasResponse = await fetch('/estatisticas/pecas');
            const pecas = await pecasResponse.json();

            const pecasChartCtx = document.getElementById('pecasChart').getContext('2d');
            const pecasChart = new Chart(pecasChartCtx, {
                type: 'bar',
                data: {
                    labels: pecas.map(peca => peca.nome),
                    datasets: [{
                        label: 'Quantidade de Peças',
                        data: pecas.map(peca => peca.quantidade),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            const montagensResponse = await fetch('/estatisticas/montagens');
            const montagens = await montagensResponse.json();

            const montagensChartCtx = document.getElementById('montagensChart').getContext('2d');
            const montagensChart = new Chart(montagensChartCtx, {
                type: 'bar',
                data: {
                    labels: montagens.map(montagem => montagem.modeloDrone),
                    datasets: [{
                        label: 'Quantidade de Pecas por Montagen',
                        data: montagens.map(montagem => montagem.pecasNecessarias.length),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    };

    document.getElementById('adicionarPecaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = e.target.nome.value;
        const quantidade = e.target.quantidade.value;

        try {
            const response = await fetch('/pecas', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({nome, quantidade})
            });

            if (response.ok) {
                alert('Peça adicionada com sucesso!');
                e.target.reset();
                fetchPecas();
                renderCharts();
            } else {
                const error = await response.text();
                alert(`Erro: ${error}`);
            }
        } catch (error) {
            console.error('Erro ao adicionar peça:', error);
        }
    });

    document.getElementById('adicionarMontagemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const modeloDrone = e.target.modeloDrone.value;
        const pecasNecessarias = Array.from(e.target.pecasNecessarias.selectedOptions).map(option => option.value);

        try {
            const response = await fetch('/montagens', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({modeloDrone, pecasNecessarias})
            });

            if (response.ok) {
                alert('Montagem adicionada com sucesso!');
                e.target.reset();
                carregarMontagens();
                renderCharts();
            } else {
                const error = await response.text();
                alert(`Erro: ${error}`);
            }
        } catch (error) {
            console.error('Erro ao adicionar montagem:', error);
        }
    });

    document.getElementById('form-completar-montagem').addEventListener('submit', async function(event) {
        event.preventDefault();

        const montagemId = document.getElementById('montagem-id').value;

        try {
            const response = await fetch(`/montagens/${montagemId}/completar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Montagem completada com sucesso');
                renderCharts();
            } else {
                alert('Erro ao completar montagem');
            }
        } catch (error) {
            console.error('Erro ao completar montagem:', error);
        }
    });

    async function carregarMontagens() {
        try {
            const response = await fetch('/estatisticas/montagens');
            const montagens = await response.json();

            const selectElement = document.getElementById('montagem-id');
            selectElement.innerHTML = ''; // Limpar as opções atuais
            montagens.forEach(montagem => {
                const option = document.createElement('option');
                option.value = montagem._id;
                option.text = montagem.modeloDrone;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar opções de montagens:', error);
        }
    }


    fetchPecas();
    carregarMontagens();
    renderCharts();

});
