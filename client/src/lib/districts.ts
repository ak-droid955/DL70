/** Delhi's districts and the assembly constituencies (by AC number) in each,
 *  for the district list on the candidate page.
 *
 *  PLACEHOLDER, likely wrong in places: taken from Wikipedia's "List of
 *  constituencies of the Delhi Legislative Assembly" (revision 1352977593),
 *  whose district column the page itself marks as out of date after the
 *  December 2025 redistricting. It has no South West Delhi district and puts
 *  15 seats under West Delhi. Replace with the Chief Electoral Officer,
 *  Delhi's district-wise list when available. */
export const DISTRICTS: readonly { name: string; acNos: readonly string[] }[] = [
  { name: 'North Delhi', acNos: ['1', '2', '3', '4', '5', '7', '13', '15', '17', '18'] },
  { name: 'North West Delhi', acNos: ['6', '8', '9', '10', '12', '14', '16'] },
  { name: 'Central Delhi', acNos: ['19', '20', '21', '22', '23'] },
  {
    name: 'West Delhi',
    acNos: ['11', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37']
  },
  { name: 'New Delhi', acNos: ['38', '39', '40', '44'] },
  { name: 'South East Delhi', acNos: ['41', '42', '49', '50', '51', '52', '53', '54'] },
  { name: 'South Delhi', acNos: ['43', '45', '46', '47', '48'] },
  { name: 'East Delhi', acNos: ['55', '56', '57', '58', '60', '61'] },
  { name: 'Shahdara', acNos: ['59', '62', '63', '64', '67'] },
  { name: 'North East Delhi', acNos: ['65', '66', '68', '69', '70'] }
];
