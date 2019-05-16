module.exports = {
    host: 'localhost:3000',
    path: '/Users/Pieter-Jan/Documents/UGent/thesis/lc',
    startTime: '2019-04-25T00:00:00.000Z',
    stopTime: '2019-04-27T00:00:00.000Z',
    agencies: [
        { 
            name: 'delijn',
            clusters: 50,
            stopUrls: [
                'https://openplanner.ilabt.imec.be/delijn/Antwerpen/stops',
                'https://openplanner.ilabt.imec.be/delijn/Limburg/stops',
                'https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops',
                'https://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops',
                'https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops'
            ],
            connectionUrls: [
                'https://openplanner.ilabt.imec.be/delijn/Antwerpen/connections',
                'https://openplanner.ilabt.imec.be/delijn/Limburg/connections',
                'https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections',
                'https://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/connections',
                'https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections',
                'https://openplanner.ilabt.imec.be/delijn/undefined/connections'
            ]
        }
    ] 
}