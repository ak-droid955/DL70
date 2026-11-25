/** Delhi's 13 districts and the assembly constituencies (by AC number) in
 *  each, for the district list on the candidate page. Official list after
 *  the December 2025 redistricting, in its own order. */
export const DISTRICTS: readonly { name: string; acNos: readonly string[] }[] = [
  { name: 'South East', acNos: ['41', '42', '49', '51', '52', '53', '54'] },
  { name: 'Old Delhi', acNos: ['19', '20', '21', '22'] },
  { name: 'North', acNos: ['2', '3', '4', '5'] },
  { name: 'New Delhi', acNos: ['38', '40'] },
  { name: 'Central', acNos: ['23', '24', '25', '39'] },
  { name: 'Central North', acNos: ['14', '15', '16', '17', '18'] },
  { name: 'South West', acNos: ['33', '34', '35', '36', '37'] },
  { name: 'Outer North', acNos: ['1', '7', '8'] },
  { name: 'North West', acNos: ['6', '9', '10', '11', '12', '13'] },
  { name: 'North East', acNos: ['63', '64', '65', '66', '67', '68', '69', '70'] },
  { name: 'East', acNos: ['55', '56', '57', '58', '59', '60', '61', '62'] },
  { name: 'South', acNos: ['43', '44', '45', '46', '47', '48', '50'] },
  { name: 'West', acNos: ['26', '27', '28', '29', '30', '31', '32'] }
];
