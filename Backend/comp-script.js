$(document).ready(function () {
    function checkDropdowns() {
        const store1Selected = $('#store1Select').val();
        const store2Selected = $('#store2Select').val();
        if (store1Selected && store2Selected) {
            const section = $('.comparison-section');
            section.addClass('open').removeClass('closed');
            section.find('.accordion-title').addClass('active');
            var accordionContent = section.find('.accordion-content');
            accordionContent.addClass('show');
            accordionContent.css('max-height', accordionContent.prop('scrollHeight') + 'px');
        }
    }

    $('#store1Select, #store2Select').change(checkDropdowns);

    $('.accordion-title').click(function () {
        const section = $(this).closest('.comparison-section');
        section.toggleClass('open closed');
        var accordionContent = section.find('.accordion-content');
        if (section.hasClass('open')) {
            accordionContent.css('max-height', accordionContent.prop('scrollHeight') + 'px');
        } else {
            accordionContent.css('max-height', '0');
        }
    });
});


let comparisonChart;
function fetchLoadStores() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "Backend/get_store_comp.php");
        xhr.responseType = "json";
        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error("Error fetching store data: " + xhr.statusText));
            }
        };
        xhr.onerror = function () {
            reject(new Error("Network error while fetching store data"));
        };
        xhr.send();
    });
}


function addOptions(dropdownId, data) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';

    const placeholderOption = new Option("-- Choose a Store --", "");
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    dropdown.appendChild(placeholderOption);

    data.sort((a, b) => a.city.localeCompare(b.city));

    data.forEach(item => {
        const option = new Option(`${item.storeID}, ${item.city}`, item.storeID);
        dropdown.appendChild(option);
    });
}

function filterOptions(select, searchTerm) {
    const options = Array.from(select.options);
    let hasMatch = false;

    options.forEach(option => {
        const optionText = option.textContent.toLowerCase();
        if (optionText.includes(searchTerm)) {
            option.style.display = 'block';
            hasMatch = true;
        } else {
            option.style.display = 'none';
        }
    });

    select.size = searchTerm && !hasMatch ? 2 : 1;
}

function fetchStoreRevenue(storeID) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `Backend/get_store_comp_revenue.php?storeID=${storeID}`);
        xhr.responseType = "json";
        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error("Error fetching store revenue: " + xhr.statusText));
            }
        };
        xhr.onerror = function () {
            reject(new Error("Network error while fetching store revenue"));
        };
        xhr.send();
    });
}

async function fetchOrderCategoryCount(storeID) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `Backend/get_order_category_count_comp.php?storeID=${storeID}`);
        xhr.responseType = "json";

        xhr.onloadstart = function () {
            console.log("AJAX request started"); // Log
        };

        xhr.onload = function () {
            console.log("XHR Success:", xhr.response);
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error("Error fetching order category count: " + xhr.statusText));
            }
        };

        xhr.onerror = function () {
            console.error("XHR Network Error");
            reject(new Error("Network error while fetching order category count"));
        };

        xhr.ontimeout = function () {
            console.error("XHR Timeout Error");
            reject(new Error("Timeout error while fetching order category count"));
        };

        xhr.onloadend = function () {
            console.log("AJAX request completed");
        };

        xhr.send();
    });
}
function updateChart(chart, store1Data, store2Data) {
    console.log("Store 1 Data:", store1Data);
    console.log("Store 2 Data:", store2Data);

    const store1Dates = store1Data.map(item => item.orderDate);
    const store2Dates = store2Data.map(item => item.orderDate);
    const allDates = [...new Set([...store1Dates, ...store2Dates])].sort();

    const store1RevenueMap = store1Data.reduce((acc, item) => {
        acc[item.orderDate] = (acc[item.orderDate] || 0) + parseFloat(item.revenue);
        return acc;
    }, {});

    const store2RevenueMap = store2Data.reduce((acc, item) => {
        acc[item.orderDate] = (acc[item.orderDate] || 0) + parseFloat(item.revenue);
        return acc;
    }, {});

    const store1Revenues = allDates.map(date => store1RevenueMap[date] || 0);
    const store2Revenues = allDates.map(date => store2RevenueMap[date] || 0);

    chart.data.labels = allDates;
    chart.data.datasets[0].data = store1Revenues;
    chart.data.datasets[0].label = "Store 1";
    chart.data.datasets[1].data = store2Revenues;
    chart.data.datasets[1].label = "Store 2";

    chart.update();

    const totalRevenueStore1 = store1Revenues.reduce((sum, revenue) => sum + revenue, 0);
    const totalRevenueStore2 = store2Revenues.reduce((sum, revenue) => sum + revenue, 0);

    console.log("Total Revenue Store 1:", totalRevenueStore1);
    console.log("Total Revenue Store 2:", totalRevenueStore2);

    if (!isNaN(totalRevenueStore1)) {
        document.getElementById('totalRevenueStore1').textContent = `$${totalRevenueStore1.toFixed(2)}`;
    }

    if (!isNaN(totalRevenueStore2)) {
        document.getElementById('totalRevenueStore2').textContent = `$${totalRevenueStore2.toFixed(2)}`;
    }
}


async function updateChartOnSelection() {
    const store1Select = document.getElementById('store1Select');
    const store2Select = document.getElementById('store2Select');

    if (store1Select.value && store2Select.value) {
        try {
            const [store1Data, store2Data] = await Promise.all([
                fetchStoreRevenue(store1Select.value),
                fetchStoreRevenue(store2Select.value)
            ]);
            updateChart(comparisonChart, store1Data, store2Data);
        } catch (error) {
            console.error("Error fetching store data for comparison: ", error);
        }
    }
}

async function initializeDropdowns() {
    const dropdownSelects = document.querySelectorAll('.dropdown-select[data-placeholder]');

    dropdownSelects.forEach(async select => {
        try {
            const data = await fetchLoadStores();
            addOptions(select.id, data);

            const searchInput = select.previousElementSibling;
            searchInput.addEventListener('click', event => event.stopPropagation());
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                filterOptions(select, searchTerm);
            });

            select.addEventListener('change', () => {
                if (select.value === "") {
                    const placeholderOption = select.querySelector('[data-placeholder]');
                    if (!placeholderOption) {
                        const newPlaceholderOption = new Option("-- Choose a Store --", "");
                        newPlaceholderOption.disabled = true;
                        newPlaceholderOption.selected = true;
                        select.insertBefore(newPlaceholderOption, select.firstChild);
                    }
                } else {
                    const placeholderOption = select.querySelector('[data-placeholder]');
                    if (placeholderOption) {
                        placeholderOption.remove();
                    }
                }

                updateChartOnSelection();
            });
        } catch (error) {
            console.error("Error fetching store data: ", error);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializeDropdowns();

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Store 1',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 0.8)',
                    backgroundColor: 'rgba(75, 192, 192, 0.8)'
                },
                {
                    label: 'Store 2',
                    data: [],
                    borderColor: 'rgba(153, 102, 255, 0.8)',
                    backgroundColor: 'rgba(153, 102, 255, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Revenue'
                    }
                }
            }
        }
    });

    const store1Select = document.getElementById('store1Select');
    const store2Select = document.getElementById('store2Select');

    store1Select.addEventListener('change', updateChartOnSelection);
    store2Select.addEventListener('change', updateChartOnSelection);

    async function updateChartOnSelection() {
        const store1Select = document.getElementById('store1Select');
        const store2Select = document.getElementById('store2Select');

        if (store1Select.value && store2Select.value) {
            try {
                const [store1Data, store2Data] = await Promise.all([
                    fetchStoreRevenue(store1Select.value),
                    fetchStoreRevenue(store2Select.value)
                ]);
                updateChart(comparisonChart, store1Data, store2Data);

                // Ajax-Anfrage nur senden, wenn beide Stores ausgewählt wurden
                $.ajax({
                    url: 'Backend/get_best_seller_comp.php',
                    type: 'GET',
                    dataType: 'json',
                    data: {
                        storeID: store1Select.value
                    },
                    success: function (data) {
                        console.log('Received data for Store 1:', data);
                        if (data.length >= 3) {
                            $('#bestsellerproduct1').text(data[0].Name);
                            $('#bestsellerproduct2').text(data[1].Name);
                            $('#bestsellerproduct3').text(data[2].Name);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Ajax request for Store 1 failed:', error);
                    }
                });

                $.ajax({
                    url: 'Backend/get_best_seller_comp.php',
                    type: 'GET',
                    dataType: 'json',
                    data: {
                        storeID: store2Select.value
                    },
                    success: function (data) {
                        console.log('Received data for Store 2:', data);
                        if (data.length >= 3) {
                            $('#bestsellerproduct4').text(data[0].Name);
                            $('#bestsellerproduct5').text(data[1].Name);
                            $('#bestsellerproduct6').text(data[2].Name);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Ajax request for Store 2 failed:', error);
                    }
                });

            } catch (error) {
                console.error("Error fetching store data for comparison: ", error);
            }
        }
    }
    /*     function updateCategoryTurnoverPieCharts(store1Data, store2Data) {
            const categories1 = store1Data.map(item => item.Category);
            const counts1 = store1Data.map(item => item.OrderCount);
    
            const categories2 = store2Data.map(item => item.Category);
            const counts2 = store2Data.map(item => item.OrderCount);
    
            updatePieChart('categoryTurnoverPieChart1', categories1, counts1, 'Store 1');
            updatePieChart('categoryTurnoverPieChart2', categories2, counts2, 'Store 2');
        } */

});

async function fetchOrderCount(storeID) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `Backend/get_totalorder_comp.php?storeID=${storeID}`);
        xhr.responseType = "json";
        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error("Error fetching order count: " + xhr.statusText));
            }
        };
        xhr.onerror = function () {
            reject(new Error("Network error while fetching order count"));
        };
        xhr.send();
    });
}

async function updateOrderCount() {
    const store1Select = document.getElementById('store1Select');
    const store2Select = document.getElementById('store2Select');

    if (store1Select.value) {
        try {
            const orderCountStore1 = await fetchOrderCount(store1Select.value);
            const totalOrderCountStore1 = document.getElementById('totalordercountStore1');
            if (totalOrderCountStore1) {
                totalOrderCountStore1.textContent = `Total Order: ${orderCountStore1}`;
            } else {
                console.error("Element with ID 'totalordercountStore1' not found.");
            }
        } catch (error) {
            console.error("Error fetching order count for Store 1: ", error);
        }
    }

    if (store2Select.value) {
        try {
            const orderCountStore2 = await fetchOrderCount(store2Select.value);
            const totalOrderCountStore2 = document.getElementById('totalordercountStore2');
            if (totalOrderCountStore2) {
                totalOrderCountStore2.textContent = `Total Order: ${orderCountStore2}`;
            } else {
                console.error("Element with ID 'totalordercountStore2' not found.");
            }
        } catch (error) {
            console.error("Error fetching order count for Store 2: ", error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    store1Select.addEventListener('change', updateOrderCount);
    store2Select.addEventListener('change', updateOrderCount);
});




function updateCategoryCountChart(store1Data, store2Data) {
    const store1Categories = store1Data.map(item => item.Category);
    const store1Counts = store1Data.map(item => parseInt(item.orderCount));

    const store2Categories = store2Data.map(item => item.Category);
    const store2Counts = store2Data.map(item => parseInt(item.orderCount));

    const store1Colors = generateRandomColors(store1Categories.length);
    const store2Colors = generateRandomColors(store2Categories.length);

    drawPieChart('store1PieChart', store1Categories, store1Counts, store1Colors);
    drawPieChart('store2PieChart', store2Categories, store2Counts, store2Colors);
}

function drawPieChart(canvasId, categories, counts, colors) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: colors,
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: canvasId === 'store1PieChart' ? 'Store 1' : 'Store 2'
            }
        }
    });
}

function generateRandomColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        colors.push(`rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.8)`);
    }
    return colors;
}

async function updateCategoryCount() {
    const store1Select = document.getElementById('store1Select');
    const store2Select = document.getElementById('store2Select');

    if (store1Select.value && store2Select.value) {
        try {
            const [store1Data, store2Data] = await Promise.all([
                fetchOrderCategoryCount(store1Select.value),
                fetchOrderCategoryCount(store2Select.value)
            ]);
            updateCategoryCountChart(store1Data, store2Data);
        } catch (error) {
            console.error("Error fetching order category count for comparison: ", error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Event-Listener für die Auswahländerungen der Dropdowns hinzufügen
    const store1Select = document.getElementById('store1Select');
    const store2Select = document.getElementById('store2Select');

    store1Select.addEventListener('change', updateCategoryCount);
    store2Select.addEventListener('change', updateCategoryCount);
    function drawPieChart(canvasId, categories, counts, colors) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                }]
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    text: canvasId === 'store1PieChart' ? 'Store 1' : 'Store 2'
                }
            }
        });
    }
    function drawBarChart(canvasId, categories, store1Counts, store2Counts) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');


        canvas.width = 600;
        canvas.height = 350;

        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Store 1',
                        data: store1Counts,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    },
                    {
                        label: 'Store 2',
                        data: store2Counts,
                        backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                           
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Orders'
                        }
                    }
                }
            }
        });
    }

    function updateCategoryCountChart(store1Data, store2Data) {
        const store1Categories = store1Data.map(item => item.Category);
        const store1Counts = store1Data.map(item => parseInt(item.orderCount));

        const store2Categories = store2Data.map(item => item.Category);
        const store2Counts = store2Data.map(item => parseInt(item.orderCount));

        const store1Colors = generateRandomColors(store1Categories.length);
        const store2Colors = generateRandomColors(store2Categories.length);

        document.getElementById('store1PieChart').width = 300;
        document.getElementById('store1PieChart').height = 300;
        document.getElementById('store2PieChart').width = 300;
        document.getElementById('store2PieChart').height = 300;

        drawPieChart('store1PieChart', store1Categories, store1Counts, store1Colors);
        drawPieChart('store2PieChart', store2Categories, store2Counts, store2Colors);

        const allCategories = Array.from(new Set([...store1Categories, ...store2Categories]));
        const alignedStore1Counts = allCategories.map(cat => store1Categories.includes(cat) ? store1Counts[store1Categories.indexOf(cat)] : 0);
        const alignedStore2Counts = allCategories.map(cat => store2Categories.includes(cat) ? store2Counts[store2Categories.indexOf(cat)] : 0);

        const canvas = document.getElementById('barChartStore');
        canvas.width = 600;
        canvas.height = 300;

        drawBarChart('barChartStore', allCategories, alignedStore1Counts, alignedStore2Counts);
    }
    document.getElementById('store2PieChart').width = 300;
    document.getElementById('store2PieChart').height = 300;
    document.getElementById('store1PieChart').style.marginRight = '10px';
    document.getElementById('store2PieChart').style.marginLeft = '10px';


    function generateRandomColors(numColors) {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            colors.push(`rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.8)`);
        }
        return colors;
    }

    async function updateCategoryCount() {
        if (store1Select.value && store2Select.value) {
            try {
                const [store1Data, store2Data] = await Promise.all([
                    fetchOrderCategoryCount(store1Select.value),
                    fetchOrderCategoryCount(store2Select.value)
                ]);
                updateCategoryCountChart(store1Data, store2Data);
            } catch (error) {
                console.error("Error fetching order category count for comparison: ", error);
            }
        }
    }
    updateCategoryCount();


});
