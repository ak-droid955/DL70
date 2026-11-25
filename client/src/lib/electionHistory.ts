/** Winners of each Delhi assembly constituency, by AC number, in every
 *  election held on the current (2008) boundaries.
 *
 *  Source: Wikipedia's "<year> Delhi Legislative Assembly election" pages,
 *  constituency results tables, read November 2026. The 2020 rows for AC 8-70
 *  and the 2025 rows were taken from summarised page text rather than copied
 *  verbatim; party totals match the official results for every year (2008:
 *  INC 43, BJP 23; 2013: BJP 31, AAP 28, INC 8; 2015: AAP 67, BJP 3; 2020: AAP
 *  62, BJP 8; 2025: BJP 48, AAP 22), but individual names are worth checking
 *  against the Election Commission's results. */
export type PastResult = { year: number; winner: string; party: string };

export const ELECTION_YEARS: readonly number[] = [2008, 2013, 2015, 2020, 2025];

export const HISTORY: Readonly<Record<string, readonly PastResult[]>> = {
  '1': [
    { year: 2008, winner: "Jaswant Singh", party: "INC" },
    { year: 2013, winner: "Neel Daman Khatri", party: "BJP" },
    { year: 2015, winner: "Sharad Chauhan", party: "AAP" },
    { year: 2020, winner: "Sharad Chauhan", party: "AAP" },
    { year: 2025, winner: "Raj Karan Khatri", party: "BJP" }
  ],
  '2': [
    { year: 2008, winner: "Shri Krishan", party: "BJP" },
    { year: 2013, winner: "Sanjeev Jha", party: "AAP" },
    { year: 2015, winner: "Sanjeev Jha", party: "AAP" },
    { year: 2020, winner: "Sanjeev Jha", party: "AAP" },
    { year: 2025, winner: "Sanjeev Jha", party: "AAP" }
  ],
  '3': [
    { year: 2008, winner: "Surinder Pal Singh", party: "INC" },
    { year: 2013, winner: "Harish Khanna", party: "AAP" },
    { year: 2015, winner: "Pankaj Pushkar", party: "AAP" },
    { year: 2020, winner: "Dilip Pandey", party: "AAP" },
    { year: 2025, winner: "Surya Prakash Khatri", party: "BJP" }
  ],
  '4': [
    { year: 2008, winner: "Mangat Ram Singhal", party: "INC" },
    { year: 2013, winner: "Ram Kishan Singhal", party: "BJP" },
    { year: 2015, winner: "Pawan Kumar", party: "AAP" },
    { year: 2020, winner: "Pawan Kumar Sharma", party: "AAP" },
    { year: 2025, winner: "Raj Kumar Bhatia", party: "BJP" }
  ],
  '5': [
    { year: 2008, winner: "Devender Yadav", party: "INC" },
    { year: 2013, winner: "Devender Yadav", party: "INC" },
    { year: 2015, winner: "Ajesh Yadav", party: "AAP" },
    { year: 2020, winner: "Ajesh Yadav", party: "AAP" },
    { year: 2025, winner: "Deepak Chaudhary", party: "BJP" }
  ],
  '6': [
    { year: 2008, winner: "Kulwant Rana", party: "BJP" },
    { year: 2013, winner: "Kulwant Rana", party: "BJP" },
    { year: 2015, winner: "Mohinder Goyal", party: "AAP" },
    { year: 2020, winner: "Mohinder Goyal", party: "AAP" },
    { year: 2025, winner: "Kulwant Rana", party: "BJP" }
  ],
  '7': [
    { year: 2008, winner: "Surender Kumar", party: "INC" },
    { year: 2013, winner: "Gugan Singh Ranga", party: "BJP" },
    { year: 2015, winner: "Ved Parkash", party: "AAP" },
    { year: 2020, winner: "Jai Bhagwan", party: "AAP" },
    { year: 2025, winner: "Ravinder Indraj Singh", party: "BJP" }
  ],
  '8': [
    { year: 2008, winner: "Manoj Kumar", party: "BJP" },
    { year: 2013, winner: "Rambir Shokeen", party: "IND" },
    { year: 2015, winner: "Sukhvir Singh", party: "AAP" },
    { year: 2020, winner: "Dharampal Lakra", party: "AAP" },
    { year: 2025, winner: "Gajender Drall", party: "BJP" }
  ],
  '9': [
    { year: 2008, winner: "Anil Jha Vats", party: "BJP" },
    { year: 2013, winner: "Anil Jha Vats", party: "BJP" },
    { year: 2015, winner: "Rituraj Govind", party: "AAP" },
    { year: 2020, winner: "Rituraj Govind", party: "AAP" },
    { year: 2025, winner: "Anil Jha Vats", party: "AAP" }
  ],
  '10': [
    { year: 2008, winner: "Jai Kishan", party: "INC" },
    { year: 2013, winner: "Jai Kishan", party: "INC" },
    { year: 2015, winner: "Sandeep Kumar", party: "AAP" },
    { year: 2020, winner: "Mukesh Kumar Ahlawat", party: "AAP" },
    { year: 2025, winner: "Mukesh Kumar Ahlawat", party: "AAP" }
  ],
  '11': [
    { year: 2008, winner: "Bijender Singh", party: "INC" },
    { year: 2013, winner: "Manoj Kumar Shokeen", party: "BJP" },
    { year: 2015, winner: "Raghuvinder Shokeen", party: "AAP" },
    { year: 2020, winner: "Raghuvinder Shokeen", party: "AAP" },
    { year: 2025, winner: "Manoj Kumar Shokeen", party: "BJP" }
  ],
  '12': [
    { year: 2008, winner: "Raj Kumar Chauhan", party: "INC" },
    { year: 2013, winner: "Rakhi Birla", party: "AAP" },
    { year: 2015, winner: "Rakhi Birla", party: "AAP" },
    { year: 2020, winner: "Rakhi Birla", party: "AAP" },
    { year: 2025, winner: "Raj Kumar Chauhan", party: "BJP" }
  ],
  '13': [
    { year: 2008, winner: "Jai Bhagwan Aggarwal", party: "BJP" },
    { year: 2013, winner: "Rajesh Garg", party: "AAP" },
    { year: 2015, winner: "Vijender Gupta", party: "BJP" },
    { year: 2020, winner: "Vijender Gupta", party: "BJP" },
    { year: 2025, winner: "Vijender Gupta", party: "BJP" }
  ],
  '14': [
    { year: 2008, winner: "Ravinder Nath Bansal", party: "BJP" },
    { year: 2013, winner: "Bandana Kumari", party: "AAP" },
    { year: 2015, winner: "Bandana Kumari", party: "AAP" },
    { year: 2020, winner: "Bandana Kumari", party: "AAP" },
    { year: 2025, winner: "Rekha Gupta", party: "BJP" }
  ],
  '15': [
    { year: 2008, winner: "Shyam Lal Garg", party: "BJP" },
    { year: 2013, winner: "Satyendra Kumar Jain", party: "AAP" },
    { year: 2015, winner: "Satyendar Jain", party: "AAP" },
    { year: 2020, winner: "Satyendra Kumar Jain", party: "AAP" },
    { year: 2025, winner: "Karnail Singh", party: "BJP" }
  ],
  '16': [
    { year: 2008, winner: "Anil Bharadwaj", party: "INC" },
    { year: 2013, winner: "Nand Kishore Garg", party: "BJP" },
    { year: 2015, winner: "Jitender Singh Tomar", party: "AAP" },
    { year: 2020, winner: "Preeti Tomar", party: "AAP" },
    { year: 2025, winner: "Tilak Ram Gupta", party: "BJP" }
  ],
  '17': [
    { year: 2008, winner: "Hari Shanker Gupta", party: "INC" },
    { year: 2013, winner: "Dr. Mahender Nagpal", party: "BJP" },
    { year: 2015, winner: "Rajesh Gupta", party: "AAP" },
    { year: 2020, winner: "Rajesh Gupta", party: "AAP" },
    { year: 2025, winner: "Poonam Sharma", party: "BJP" }
  ],
  '18': [
    { year: 2008, winner: "Kanwar Karan Singh", party: "INC" },
    { year: 2013, winner: "Akhilesh Pati Tripathi", party: "AAP" },
    { year: 2015, winner: "Akhilesh Pati Tripathi", party: "AAP" },
    { year: 2020, winner: "Akhilesh Pati Tripathi", party: "AAP" },
    { year: 2025, winner: "Ashok Goel", party: "BJP" }
  ],
  '19': [
    { year: 2008, winner: "Rajesh Jain", party: "INC" },
    { year: 2013, winner: "Som Dutt", party: "AAP" },
    { year: 2015, winner: "Som Dutt", party: "AAP" },
    { year: 2020, winner: "Som Dutt", party: "AAP" },
    { year: 2025, winner: "Som Dutt", party: "AAP" }
  ],
  '20': [
    { year: 2008, winner: "Parlad Singh Sawhney", party: "INC" },
    { year: 2013, winner: "Parlad Singh Sawhney", party: "INC" },
    { year: 2015, winner: "Alka Lamba", party: "AAP" },
    { year: 2020, winner: "Parlad Singh Sawhney", party: "AAP" },
    { year: 2025, winner: "Punardeep Singh Sawhney", party: "AAP" }
  ],
  '21': [
    { year: 2008, winner: "Shoaib Iqbal", party: "LJP" },
    { year: 2013, winner: "Shoaib Iqbal", party: "JD(U)" },
    { year: 2015, winner: "Asim Ahmed Khan", party: "AAP" },
    { year: 2020, winner: "Shoaib Iqbal", party: "AAP" },
    { year: 2025, winner: "Aaley Mohammad Iqbal", party: "AAP" }
  ],
  '22': [
    { year: 2008, winner: "Haroon Yusuf", party: "INC" },
    { year: 2013, winner: "Haroon Yusuf", party: "INC" },
    { year: 2015, winner: "Imran Hussain", party: "AAP" },
    { year: 2020, winner: "Imran Hussain", party: "AAP" },
    { year: 2025, winner: "Imran Hussain", party: "AAP" }
  ],
  '23': [
    { year: 2008, winner: "Surender Pal Ratawal", party: "BJP" },
    { year: 2013, winner: "Vishesh Ravi", party: "AAP" },
    { year: 2015, winner: "Vishesh Ravi", party: "AAP" },
    { year: 2020, winner: "Vishesh Ravi", party: "AAP" },
    { year: 2025, winner: "Vishesh Ravi", party: "AAP" }
  ],
  '24': [
    { year: 2008, winner: "Rajesh Lilothia", party: "INC" },
    { year: 2013, winner: "Veena Anand", party: "AAP" },
    { year: 2015, winner: "Hazari Lal Chauhan", party: "AAP" },
    { year: 2020, winner: "Raaj Kumar Anand", party: "AAP" },
    { year: 2025, winner: "Pravesh Ratn", party: "AAP" }
  ],
  '25': [
    { year: 2008, winner: "Subhash Sachdeva", party: "BJP" },
    { year: 2013, winner: "Subhash Sachdeva", party: "BJP" },
    { year: 2015, winner: "Shiv Charan Goel", party: "AAP" },
    { year: 2020, winner: "Shiv Charan Goel", party: "AAP" },
    { year: 2025, winner: "Harish Khurana", party: "BJP" }
  ],
  '26': [
    { year: 2008, winner: "Mala Ram Gangwal", party: "INC" },
    { year: 2013, winner: "Girish Soni", party: "AAP" },
    { year: 2015, winner: "Girish Soni", party: "AAP" },
    { year: 2020, winner: "Girish Soni", party: "AAP" },
    { year: 2025, winner: "Kailash Gangwal", party: "BJP" }
  ],
  '27': [
    { year: 2008, winner: "Dyanand Chandila", party: "INC" },
    { year: 2013, winner: "Manjinder Singh Sirsa", party: "SAD" },
    { year: 2015, winner: "Jarnail Singh", party: "AAP" },
    { year: 2020, winner: "Dhanwati Chandela", party: "AAP" },
    { year: 2025, winner: "Manjinder Singh Sirsa", party: "BJP" }
  ],
  '28': [
    { year: 2008, winner: "Harsharan Singh Balli", party: "BJP" },
    { year: 2013, winner: "Jagdeep Singh", party: "AAP" },
    { year: 2015, winner: "Jagdeep Singh", party: "AAP" },
    { year: 2020, winner: "Raj Kumari Dhillon", party: "AAP" },
    { year: 2025, winner: "Shyam Sharma", party: "BJP" }
  ],
  '29': [
    { year: 2008, winner: "O P Babbar", party: "BJP" },
    { year: 2013, winner: "Jarnail Singh", party: "AAP" },
    { year: 2015, winner: "Jarnail Singh", party: "AAP" },
    { year: 2020, winner: "Jarnail Singh", party: "AAP" },
    { year: 2025, winner: "Jarnail Singh", party: "AAP" }
  ],
  '30': [
    { year: 2008, winner: "Jagdish Mukhi", party: "BJP" },
    { year: 2013, winner: "Jagdish Mukhi", party: "BJP" },
    { year: 2015, winner: "Rajesh Rishi", party: "AAP" },
    { year: 2020, winner: "Rajesh Rishi", party: "AAP" },
    { year: 2025, winner: "Ashish Sood", party: "BJP" }
  ],
  '31': [
    { year: 2008, winner: "Nand Kishore", party: "INC" },
    { year: 2013, winner: "Mahinder Yadav", party: "AAP" },
    { year: 2015, winner: "Mahinder Yadav", party: "AAP" },
    { year: 2020, winner: "Mahinder Yadav", party: "AAP" },
    { year: 2025, winner: "Pankaj Kumar Singh", party: "BJP" }
  ],
  '32': [
    { year: 2008, winner: "Mukesh Sharma", party: "INC" },
    { year: 2013, winner: "Pawan Sharma", party: "BJP" },
    { year: 2015, winner: "Naresh Balyan", party: "AAP" },
    { year: 2020, winner: "Naresh Balyan", party: "AAP" },
    { year: 2025, winner: "Pawan Sharma", party: "BJP" }
  ],
  '33': [
    { year: 2008, winner: "Mahabal Mishra", party: "INC" },
    { year: 2013, winner: "Parduymn Rajput", party: "BJP" },
    { year: 2015, winner: "Adarsh Shastri", party: "AAP" },
    { year: 2020, winner: "Vinay Mishra", party: "AAP" },
    { year: 2025, winner: "Parduymn Rajput", party: "BJP" }
  ],
  '34': [
    { year: 2008, winner: "Sumesh Shokeen", party: "INC" },
    { year: 2013, winner: "Rajesh Gahlot", party: "BJP" },
    { year: 2015, winner: "Gulab Singh", party: "AAP" },
    { year: 2020, winner: "Gulab Singh", party: "AAP" },
    { year: 2025, winner: "Sandeep Sehrawat", party: "BJP" }
  ],
  '35': [
    { year: 2008, winner: "Bharat Singh", party: "IND" },
    { year: 2013, winner: "Ajeet Singh Kharkhari", party: "BJP" },
    { year: 2015, winner: "Kailash Gahlot", party: "AAP" },
    { year: 2020, winner: "Kailash Gahlot", party: "AAP" },
    { year: 2025, winner: "Neelam Pahalwan", party: "BJP" }
  ],
  '36': [
    { year: 2008, winner: "Sat Prakash Rana", party: "BJP" },
    { year: 2013, winner: "Sat Prakash Rana", party: "BJP" },
    { year: 2015, winner: "Col Devinder Sehrawat", party: "AAP" },
    { year: 2020, winner: "Bhupinder Singh Joon", party: "AAP" },
    { year: 2025, winner: "Kailash Gahlot", party: "BJP" }
  ],
  '37': [
    { year: 2008, winner: "Dharam Dev Solanki", party: "BJP" },
    { year: 2013, winner: "Dharam Dev Solanki", party: "BJP" },
    { year: 2015, winner: "Bhavna Gaur", party: "AAP" },
    { year: 2020, winner: "Bhavna Gaur", party: "AAP" },
    { year: 2025, winner: "Kuldeep Solanki", party: "BJP" }
  ],
  '38': [
    { year: 2008, winner: "Karan Singh Tanwar", party: "BJP" },
    { year: 2013, winner: "Surinder Singh", party: "AAP" },
    { year: 2015, winner: "Surender Singh", party: "AAP" },
    { year: 2020, winner: "Virender Singh Kadian", party: "AAP" },
    { year: 2025, winner: "Virender Singh Kadian", party: "AAP" }
  ],
  '39': [
    { year: 2008, winner: "Rama Kant Goswami", party: "INC" },
    { year: 2013, winner: "R. P. Singh", party: "BJP" },
    { year: 2015, winner: "Vijender Garg Vijay", party: "AAP" },
    { year: 2020, winner: "Raghav Chadha", party: "AAP" },
    { year: 2025, winner: "Umang Bajaj", party: "BJP" }
  ],
  '40': [
    { year: 2008, winner: "Sheila Dikshit", party: "INC" },
    { year: 2013, winner: "Arvind Kejriwal", party: "AAP" },
    { year: 2015, winner: "Arvind Kejriwal", party: "AAP" },
    { year: 2020, winner: "Arvind Kejriwal", party: "AAP" },
    { year: 2025, winner: "Parvesh Verma", party: "BJP" }
  ],
  '41': [
    { year: 2008, winner: "Tarvinder Singh Marwah", party: "INC" },
    { year: 2013, winner: "Maninder Singh Dhir", party: "AAP" },
    { year: 2015, winner: "Praveen Kumar", party: "AAP" },
    { year: 2020, winner: "Praveen Kumar", party: "AAP" },
    { year: 2025, winner: "Tarvinder Singh Marwah", party: "BJP" }
  ],
  '42': [
    { year: 2008, winner: "Neeraj Basoya", party: "INC" },
    { year: 2013, winner: "Madan Lal", party: "AAP" },
    { year: 2015, winner: "Madan Lal", party: "AAP" },
    { year: 2020, winner: "Madan Lal", party: "AAP" },
    { year: 2025, winner: "Neeraj Basoya", party: "BJP" }
  ],
  '43': [
    { year: 2008, winner: "Kiran Walia", party: "INC" },
    { year: 2013, winner: "Somnath Bharti", party: "AAP" },
    { year: 2015, winner: "Somnath Bharti", party: "AAP" },
    { year: 2020, winner: "Somnath Bharti", party: "AAP" },
    { year: 2025, winner: "Satish Upadhyay", party: "BJP" }
  ],
  '44': [
    { year: 2008, winner: "Barkha Singh", party: "INC" },
    { year: 2013, winner: "Anil Kumar Sharma", party: "BJP" },
    { year: 2015, winner: "Parmila Tokas", party: "AAP" },
    { year: 2020, winner: "Pramila Tokas", party: "AAP" },
    { year: 2025, winner: "Anil Kumar Sharma", party: "BJP" }
  ],
  '45': [
    { year: 2008, winner: "Yoganand Shastri", party: "INC" },
    { year: 2013, winner: "Parvesh Verma", party: "BJP" },
    { year: 2015, winner: "Naresh Yadav", party: "AAP" },
    { year: 2020, winner: "Naresh Yadav", party: "AAP" },
    { year: 2025, winner: "Gajender Singh Yadav", party: "BJP" }
  ],
  '46': [
    { year: 2008, winner: "Balram Tanwar", party: "INC" },
    { year: 2013, winner: "Brahm Singh Tanwar", party: "BJP" },
    { year: 2015, winner: "Kartar Singh Tanwar", party: "AAP" },
    { year: 2020, winner: "Kartar Singh Tanwar", party: "AAP" },
    { year: 2025, winner: "Kartar Singh Tanwar", party: "BJP" }
  ],
  '47': [
    { year: 2008, winner: "Arvinder Singh Lovely", party: "INC" },
    { year: 2013, winner: "Prakash Jarwal", party: "AAP" },
    { year: 2015, winner: "Prakash Jarwal", party: "AAP" },
    { year: 2020, winner: "Prakash Jarwal", party: "AAP" },
    { year: 2025, winner: "Prem Chauhan", party: "AAP" }
  ],
  '48': [
    { year: 2008, winner: "Ch Prem Singh", party: "INC" },
    { year: 2013, winner: "Ashok Kumar Chauhan", party: "AAP" },
    { year: 2015, winner: "Ajay Dutt", party: "AAP" },
    { year: 2020, winner: "Ajay Dutt", party: "AAP" },
    { year: 2025, winner: "Ajay Dutt", party: "AAP" }
  ],
  '49': [
    { year: 2008, winner: "Dr Shiv Charan Lal Gupta", party: "BJP" },
    { year: 2013, winner: "Dinesh Mohaniya", party: "AAP" },
    { year: 2015, winner: "Dinesh Mohaniya", party: "AAP" },
    { year: 2020, winner: "Dinesh Mohaniya", party: "AAP" },
    { year: 2025, winner: "Chandan Kumar Choudhary", party: "BJP" }
  ],
  '50': [
    { year: 2008, winner: "Vijay Kumar Malhotra", party: "BJP" },
    { year: 2013, winner: "Saurabh Bhardwaj", party: "AAP" },
    { year: 2015, winner: "Saurabh Bharadwaj", party: "AAP" },
    { year: 2020, winner: "Saurabh Bhardwaj", party: "AAP" },
    { year: 2025, winner: "Shikha Roy", party: "BJP" }
  ],
  '51': [
    { year: 2008, winner: "Subhash Chopra", party: "INC" },
    { year: 2013, winner: "Harmeet Singh Kalka", party: "BJP" },
    { year: 2015, winner: "Avtar Singh Kalkaji", party: "AAP" },
    { year: 2020, winner: "Atishi", party: "AAP" },
    { year: 2025, winner: "Atishi", party: "AAP" }
  ],
  '52': [
    { year: 2008, winner: "Ramesh Bidhuri", party: "BJP" },
    { year: 2013, winner: "Ramesh Bidhuri", party: "BJP" },
    { year: 2015, winner: "Sahi Ram", party: "AAP" },
    { year: 2020, winner: "Sahi Ram", party: "AAP" },
    { year: 2025, winner: "Sahi Ram", party: "AAP" }
  ],
  '53': [
    { year: 2008, winner: "Ram Singh Netaji", party: "BSP" },
    { year: 2013, winner: "Ramvir Singh Bidhuri", party: "BJP" },
    { year: 2015, winner: "Narayan Dutt Sharma", party: "AAP" },
    { year: 2020, winner: "Ramvir Singh Bidhuri", party: "BJP" },
    { year: 2025, winner: "Ram Singh Netaji", party: "AAP" }
  ],
  '54': [
    { year: 2008, winner: "Parvez Hashmi", party: "INC" },
    { year: 2013, winner: "Asif Muhammad Khan", party: "INC" },
    { year: 2015, winner: "Amanatullah Khan", party: "AAP" },
    { year: 2020, winner: "Amanatullah Khan", party: "AAP" },
    { year: 2025, winner: "Amanatullah Khan", party: "AAP" }
  ],
  '55': [
    { year: 2008, winner: "Sunil Kumar", party: "BJP" },
    { year: 2013, winner: "Raju Dhingan", party: "AAP" },
    { year: 2015, winner: "Raju Dhingan", party: "AAP" },
    { year: 2020, winner: "Rohit Kumar Mehraulia", party: "AAP" },
    { year: 2025, winner: "Ravikant Ujjain", party: "BJP" }
  ],
  '56': [
    { year: 2008, winner: "Amrish Singh Gautam", party: "INC" },
    { year: 2013, winner: "Manoj Kumar", party: "AAP" },
    { year: 2015, winner: "Manoj Kumar", party: "AAP" },
    { year: 2020, winner: "Kuldeep Kumar", party: "AAP" },
    { year: 2025, winner: "Kuldeep Kumar", party: "AAP" }
  ],
  '57': [
    { year: 2008, winner: "Anil Chaudhary", party: "INC" },
    { year: 2013, winner: "Manish Sisodia", party: "AAP" },
    { year: 2015, winner: "Manish Sisodia", party: "AAP" },
    { year: 2020, winner: "Manish Sisodia", party: "AAP" },
    { year: 2025, winner: "Ravinder Singh Negi", party: "BJP" }
  ],
  '58': [
    { year: 2008, winner: "Dr. Ashok Kumar Walia", party: "INC" },
    { year: 2013, winner: "Vinod Kumar Binny", party: "AAP" },
    { year: 2015, winner: "Nitin Tyagi", party: "AAP" },
    { year: 2020, winner: "Abhay Verma", party: "BJP" },
    { year: 2025, winner: "Abhay Verma", party: "BJP" }
  ],
  '59': [
    { year: 2008, winner: "Naseeb Singh", party: "INC" },
    { year: 2013, winner: "Om Prakash Sharma", party: "BJP" },
    { year: 2015, winner: "Om Prakash Sharma", party: "BJP" },
    { year: 2020, winner: "Om Prakash Sharma", party: "BJP" },
    { year: 2025, winner: "Om Prakash Sharma", party: "BJP" }
  ],
  '60': [
    { year: 2008, winner: "Harsh Vardhan", party: "BJP" },
    { year: 2013, winner: "Harsh Vardhan", party: "BJP" },
    { year: 2015, winner: "S K Bagga", party: "AAP" },
    { year: 2020, winner: "S.K. Bagga", party: "AAP" },
    { year: 2025, winner: "Anil Goyal", party: "BJP" }
  ],
  '61': [
    { year: 2008, winner: "Arvinder Singh Lovely", party: "INC" },
    { year: 2013, winner: "Arvinder Singh Lovely", party: "INC" },
    { year: 2015, winner: "Anil Kumar Bajpai", party: "AAP" },
    { year: 2020, winner: "Anil Kumar Bajpai", party: "BJP" },
    { year: 2025, winner: "Arvinder Singh Lovely", party: "BJP" }
  ],
  '62': [
    { year: 2008, winner: "Dr Narender Nath", party: "INC" },
    { year: 2013, winner: "Jitender Singh Shunty", party: "BJP" },
    { year: 2015, winner: "Ram Niwas Goel", party: "AAP" },
    { year: 2020, winner: "Ram Niwas Goel", party: "AAP" },
    { year: 2025, winner: "Sanjay Goyal", party: "BJP" }
  ],
  '63': [
    { year: 2008, winner: "Veer Singh Dhingan", party: "INC" },
    { year: 2013, winner: "Dharmender Singh", party: "AAP" },
    { year: 2015, winner: "Rajendra Pal Gautam", party: "AAP" },
    { year: 2020, winner: "Rajendra Pal Gautam", party: "AAP" },
    { year: 2025, winner: "Veer Singh Dhingan", party: "AAP" }
  ],
  '64': [
    { year: 2008, winner: "Ram Babu Sharma", party: "INC" },
    { year: 2013, winner: "Jitender Mahajan", party: "BJP" },
    { year: 2015, winner: "Sarita Singh", party: "AAP" },
    { year: 2020, winner: "Jitender Mahajan", party: "BJP" },
    { year: 2025, winner: "Jitender Mahajan", party: "BJP" }
  ],
  '65': [
    { year: 2008, winner: "Chaudhary Mateen Ahmed", party: "INC" },
    { year: 2013, winner: "Chaudhary Mateen Ahmed", party: "INC" },
    { year: 2015, winner: "Mohd. Ishraque", party: "AAP" },
    { year: 2020, winner: "Abdul Rehman", party: "AAP" },
    { year: 2025, winner: "Chaudhary Zubair Ahmad", party: "AAP" }
  ],
  '66': [
    { year: 2008, winner: "Sahab Singh Chauhan", party: "BJP" },
    { year: 2013, winner: "Sahab Singh Chauhan", party: "BJP" },
    { year: 2015, winner: "Shri Dutt Sharma", party: "AAP" },
    { year: 2020, winner: "Ajay Mahawar", party: "BJP" },
    { year: 2025, winner: "Ajay Mahawar", party: "BJP" }
  ],
  '67': [
    { year: 2008, winner: "Naresh Gaur", party: "BJP" },
    { year: 2013, winner: "Naresh Gaur", party: "BJP" },
    { year: 2015, winner: "Gopal Rai", party: "AAP" },
    { year: 2020, winner: "Gopal Rai", party: "AAP" },
    { year: 2025, winner: "Gopal Rai", party: "AAP" }
  ],
  '68': [
    { year: 2008, winner: "Surendra Kumar", party: "BSP" },
    { year: 2013, winner: "Rajneet Singh", party: "BJP" },
    { year: 2015, winner: "Fateh Singh", party: "AAP" },
    { year: 2020, winner: "Surendra Kumar", party: "AAP" },
    { year: 2025, winner: "Surendra Kumar", party: "AAP" }
  ],
  '69': [
    { year: 2008, winner: "Hasan Ahmed", party: "INC" },
    { year: 2013, winner: "Hasan Ahmed", party: "INC" },
    { year: 2015, winner: "Jagdish Pradhan", party: "BJP" },
    { year: 2020, winner: "Haji Yunus", party: "AAP" },
    { year: 2025, winner: "Mohan Singh Bisht", party: "BJP" }
  ],
  '70': [
    { year: 2008, winner: "Mohan Singh Bisht", party: "BJP" },
    { year: 2013, winner: "Mohan Singh Bisht", party: "BJP" },
    { year: 2015, winner: "Kapil Mishra", party: "AAP" },
    { year: 2020, winner: "Mohan Singh Bisht", party: "BJP" },
    { year: 2025, winner: "Kapil Mishra", party: "BJP" }
  ]
};
