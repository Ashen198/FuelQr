$(document).ready(function () {
    console.log('App JS loaded and ready.');

    const apiUrl = '/api/stations';


    loadStations();


    $('#addStationBtn').click(function () {
        console.log('Add Station button clicked');
        $('#stationForm')[0].reset();
        $('#stationId').val('');
        $('#stationModalLabel').text('Add Station');
    });


    $(document).on('submit', '#stationForm', function (e) {
        e.preventDefault();
        console.log('Form submission triggered');

        const stationId = $('#stationId').val();
        const name = $('#name').val();
        const operatingHours = $('#operatingHours').val();
        const contact = $('#contact').val();
        const facilitiesRaw = $('#facilities').val();

        console.log('Form data:', { name, operatingHours, contact, facilitiesRaw });

        const stationData = {
            name: name,
            operatingHours: operatingHours,
            contact: contact,
            facilities: facilitiesRaw ? facilitiesRaw.split(',').map(f => f.trim()) : []
        };

        if (stationId) {
            console.log('Updating station:', stationId);
            $.ajax({
                url: `${apiUrl}/${stationId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(stationData),
                success: function () {
                    $('#stationModal').modal('hide');
                    loadStations();
                    alert('Station updated successfully!');
                },
                error: function (xhr) {
                    const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Error updating station';
                    alert(errorMsg);
                    console.error('Error updating station:', xhr);
                }
            });
        } else {
            console.log('Adding new station');
            $.ajax({
                url: apiUrl,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(stationData),
                success: function () {
                    $('#stationModal').modal('hide');
                    loadStations();
                    alert('Station added successfully!');
                },
                error: function (xhr) {
                    const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Error adding station';
                    alert(errorMsg);
                    console.error('Error adding station:', xhr);
                }
            });
        }
    });


    $('#stationTableBody').on('click', '.edit-btn', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const hours = $(this).data('hours');
        const contact = $(this).data('contact');
        const facilities = $(this).data('facilities');

        $('#stationId').val(id);
        $('#name').val(name);
        $('#operatingHours').val(hours);
        $('#contact').val(contact);
        $('#facilities').val(facilities);

        $('#stationModalLabel').text('Edit Station');
        $('#stationModal').modal('show');
    });


    $('#stationTableBody').on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this station?')) {
            $.ajax({
                url: `${apiUrl}/${id}`,
                type: 'DELETE',
                success: function () {
                    loadStations();
                    alert('Station deleted successfully!');
                },
                error: function (xhr) {
                    const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Error deleting station';
                    alert(errorMsg);
                    console.error('Error deleting station:', xhr);
                }
            });
        }
    });


    function loadStations() {
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (stations) {
                const tbody = $('#stationTableBody');
                tbody.empty();
                $('#stationCount').text(stations.length);

                stations.forEach(station => {
                    const facilitiesStr = station.facilities.join(', ');
                    const row = `
                        <tr>
                            <td class="fw-bold">${station.name}</td>
                            <td>${station.operatingHours}</td>
                            <td>${station.contact}</td>
                            <td>${facilitiesStr}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-secondary edit-btn me-2" 
                                    data-id="${station.id}" 
                                    data-name="${station.name}" 
                                    data-hours="${station.operatingHours}" 
                                    data-contact="${station.contact}" 
                                    data-facilities="${facilitiesStr}">
                                    <i class="fa fa-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${station.id}">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Error fetching stations';

                console.error('Error fetching stations:', xhr);
            }
        });
    }
});
