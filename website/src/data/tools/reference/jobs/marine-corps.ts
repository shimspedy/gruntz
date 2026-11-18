import type { Job, Provenance } from '../../types';

/**
 * U.S. Marine Corps military occupational specialties (MOS), from the FY2027 MOS Manual,
 * NAVMC 1200.1M (approved 2 Mar 2026, implemented 1 Oct 2026 per MARADMIN 122/26).
 *
 * Every MOS entry in Chapter 1 (officer) and Chapter 3 (enlisted) is included: primary (PMOS),
 * basic (BMOS), necessary (NMOS), free (FMOS) and exception (EMOS) MOSs. The trailing comment on
 * each row is the MOS type as printed in the manual. Officer-chapter MOSs open only to CWO5-WO
 * are 'warrant'; those open to both commissioned and warrant officers appear twice, once as
 * 'officer' and once as 'warrant'. Titles are as printed in the manual.
 */
export const jobs: Job[] = [
  { branch: 'marine-corps', code: '0111', title: "Administrative Specialist", field: "OccFld 01 Manpower and Administration", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0147', title: "Equal Opportunity Advisor (EOA)", field: "OccFld 01 Manpower and Administration", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0149', title: "Substance Abuse Control Specialist", field: "OccFld 01 Manpower and Administration", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0161', title: "Postal Clerk", field: "OccFld 01 Manpower and Administration", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0171', title: "Manpower Information Systems (MIS) Analyst", field: "OccFld 01 Manpower and Administration", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0160', title: "Postal Officer", field: "OccFld 01 Manpower and Administration", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0170', title: "Personnel Officer", field: "OccFld 01 Manpower and Administration", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0102', title: "Manpower Officer", field: "OccFld 01 Manpower and Administration", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0149', title: "Substance Abuse Control Officer (SACO)", field: "OccFld 01 Manpower and Administration", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0211', title: "Counterintelligence/Human Intelligence (CI/HUMINT) Specialist", field: "OccFld 02 Intelligence", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0212', title: "Technical Counterintelligence Specialist", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0231', title: "Intelligence Specialist", field: "OccFld 02 Intelligence", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0233', title: "Intelligence Tactics Instructor", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0234', title: "Logistics Intelligence Planner", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0239', title: "Intelligence Analyst", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0241', title: "Imagery Analysis Specialist", field: "OccFld 02 Intelligence", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0245', title: "Target Mensuration Analyst", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0261', title: "Geospatial Intelligence Specialist", field: "OccFld 02 Intelligence", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0271', title: "Aviation Intelligence Specialists", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0275', title: "Collection Manager", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0277', title: "Weapons and Tactics Instructor (WTI) Intelligence Marine", field: "OccFld 02 Intelligence", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0291', title: "Intelligence Chief", field: "OccFld 02 Intelligence", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0205', title: "Intelligence Operations and Fusion Warrant Officer", field: "OccFld 02 Intelligence", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0210', title: "Counterintelligence/Human Source Intelligence (CI/HUMINT) Operations and Sensitive Activities Officer", field: "OccFld 02 Intelligence", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0233', title: "Intelligence Tactics Instructor", field: "OccFld 02 Intelligence", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '0275', title: "Collection Management Officer", field: "OccFld 02 Intelligence", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '0277', title: "Weapons and Tactics Instructor (WTI) Intelligence Officer", field: "OccFld 02 Intelligence", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '0202', title: "Intelligence Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0203', title: "Ground Intelligence Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0204', title: "Counterintelligence (CI)/Human Intelligence (HUMINT) Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0206', title: "Signals Intelligence/Ground Electromagnetic Warfare Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0207', title: "Air Intelligence Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0209', title: "Marine Air Ground Task Force (MAGTF) Intelligence Planner", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0233', title: "Intelligence Tactics Instructor", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0234', title: "Logistics Intelligence Planner", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0275', title: "Collection Management Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0277', title: "Weapons and Tactics Instructor (WTI) Intelligence Officer", field: "OccFld 02 Intelligence", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0300', title: "Basic Infantry Marine", field: "OccFld 03 Infantry", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '0311', title: "Rifleman", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0313', title: "Light Armored Reconnaissance Marine", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0317', title: "Scout Sniper", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0321', title: "Reconnaissance Marine", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0322', title: "Reconnaissance Marine, Sniper Qualified", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0323', title: "Reconnaissance Marine, Parachute Qualified", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0324', title: "Reconnaissance Marine, Combatant Diver Qualified", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0326', title: "Reconnaissance Marine, Parachute and Combatant Diver Qualified", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0327', title: "Reconnaissance Team Leader", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0331', title: "Machine Gunner", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0341', title: "Mortarman", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0352', title: "Antitank Missile Gunner", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0363', title: "Light Armored Reconnaissance Unit Leader", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0365', title: "Infantry Squad Leader", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0367', title: "Light Armored Reconnaissance Master Gunner", field: "OccFld 03 Infantry", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0369', title: "Infantry Unit Leader", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0372', title: "Marine Raider", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0393', title: "Light Armored Reconnaissance Operations Chief", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0399', title: "Operations Chief", field: "OccFld 03 Infantry", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0306', title: "Infantry Weapons Officer", field: "OccFld 03 Infantry", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0302', title: "Infantry Officer", field: "OccFld 03 Infantry", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0303', title: "Light-Armored Reconnaissance (LAR) Officer", field: "OccFld 03 Infantry", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0307', title: "Expeditionary Ground Reconnaissance (EGR) Officer", field: "OccFld 03 Infantry", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0370', title: "Marine Raider Officer", field: "OccFld 03 Infantry", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0411', title: "Maintenance Management Analyst", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0431', title: "Logistics/Embarkation Specialist", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0441', title: "Logistics Specialist", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0451', title: "Airborne and Air Delivery Specialist", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0471', title: "Personnel Retrieval and Processing Specialist", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0472', title: "Personnel Retrieval and Processing Technician", field: "OccFld 04 Logistics", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0477', title: "Expeditionary Logistics Instructor", field: "OccFld 04 Logistics", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0481', title: "Landing Support Specialist", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0491', title: "Logistics/Mobility Chief", field: "OccFld 04 Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0408', title: "Fatality Management Officer", field: "OccFld 04 Logistics", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0430', title: "Mobility Officer", field: "OccFld 04 Logistics", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0402', title: "Logistics Officer", field: "OccFld 04 Logistics", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0405', title: "Aerial Delivery Officer", field: "OccFld 04 Logistics", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0407', title: "Personnel Retrieval and Processing Officer", field: "OccFld 04 Logistics", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0430', title: "Mobility Officer", field: "OccFld 04 Logistics", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0477', title: "Expeditionary Logistics Instructor", field: "OccFld 04 Logistics", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0506', title: "Red Team Member", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0511', title: "MAGTF Planning Specialist", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0522', title: "Psychological Operations (PSYOP) Non-Commissioned Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0538', title: "Female Engagement Specialist", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0551', title: "Information Specialist", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0557', title: "Total Force Integrator Staff Non-Commissioned Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0560', title: "Security Cooperation (SC) Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0570', title: "Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0571', title: "Operational Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0577', title: "Operations and Tactics Instructor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0580', title: "Foreign Disclosure Representative (FDR)", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0570', title: "Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '0571', title: "Operational Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '0577', title: "Operations and Tactics Instructor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '0580', title: "Foreign Disclosure Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '0502', title: "Force Deployment Planning and Execution (FDP&E) Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0505', title: "Operational Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0506', title: "Red Team Member", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0507', title: "Strategic Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0508', title: "Strategy Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0509', title: "Marine Corps Strategist", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0510', title: "Basic Information Staff Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0520', title: "Psychological Operations (PSYOP) Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0534', title: "Female Engagement Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0550', title: "Advanced Information Operations Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0555', title: "Total Force Integration Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0560', title: "Security Cooperation (SC) Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0570', title: "Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0571', title: "Operational Advisor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0577', title: "Operations and Tactics Instructor", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0580', title: "Foreign Disclosure Officer", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0588', title: "Aviation Electromagnetic Spectrum Operations (EMSO) Planner", field: "OccFld 05 Marine Air Ground Task Force (MAGTF) Plans", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0621', title: "Transmissions System Operator", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0623', title: "Troposcatter Transmissions System Operator", field: "OccFld 06 Communications", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0627', title: "Satellite Transmissions System Operator", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0628', title: "Tactical Transmission Systems Operator Maintainer", field: "OccFld 06 Communications", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0629', title: "Transmissions Chief", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0631', title: "Network Administrator", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0633', title: "Network Transport Technician", field: "OccFld 06 Communications", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0639', title: "Network Chief", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0648', title: "Electromagnetic Spectrum Maneuver Chief", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0671', title: "Systems and Infrastructure Administrator", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0673', title: "Software Operations Marine", field: "OccFld 06 Communications", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0679', title: "Systems and Infrastructure Chief", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0681', title: "Information Security Technician", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0699', title: "Communications Chief", field: "OccFld 06 Communications", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0620', title: "Space and Propagation Engineering Officer (SPEO)", field: "OccFld 06 Communications", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0630', title: "Network Engineering Officer", field: "OccFld 06 Communications", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0640', title: "Strategic Electromagnetic Spectrum Officer", field: "OccFld 06 Communications", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0670', title: "Systems and Infrastructure Engineer Officer", field: "OccFld 06 Communications", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0602', title: "Communications Officer", field: "OccFld 06 Communications", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0603', title: "Marine Air Ground Task Force (MAGTF) Communications Planner", field: "OccFld 06 Communications", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '0605', title: "Cyber Network Operations Officer", field: "OccFld 06 Communications", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0811', title: "Field Artillery Cannoneer", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0814', title: "High Mobility Artillery Rocket System (HIMARS) Operator", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0842', title: "Field Artillery Radar Operator", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0844', title: "Field Artillery Fire Control Marine", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0847', title: "Field Artillery Sensor Support Marine", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0848', title: "Field Artillery Operations Chief", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0861', title: "Fire Support Marine", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0869', title: "Artillery Unit Leader", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0871', title: "Joint Fires and Effects Integrator", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '0873', title: "Joint Fires Observer", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0874', title: "Joint Fires Observer Evaluator", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0875', title: "Joint Terminal Attack Controller Instructor", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0876', title: "Joint Terminal Attack Controller Evaluator", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0877', title: "Weapons and Tactics Instructor-Tactical Air Control Party Program Manager", field: "OccFld 08 Field Artillery", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0803', title: "Target Acquisition Officer", field: "OccFld 08 Field Artillery", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0802', title: "Field Artillery Officer", field: "OccFld 08 Field Artillery", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '0840', title: "Naval Surface Fire Support Planner", field: "OccFld 08 Field Artillery", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0911', title: "Drill Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0913', title: "Marine Combat Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0914', title: "Marine Special Operations Forces Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '0916', title: "Martial Arts Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0917', title: "Martial Arts Instructor-Trainer", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0918', title: "Water Safety/Survival Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0919', title: "Force Fitness Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0931', title: "Marksmanship Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0932', title: "Small Arms Weapons Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0933', title: "Marksmanship Coach", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0941', title: "Winter Mountain Leader", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0943', title: "Summer Mountain Leader", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0945', title: "Summer/Winter Mountain Leader (SWML)", field: "OccFld 09 Training", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '0951', title: "Formal School Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0961', title: "Staff Noncommissioned Officer Academy Faculty Advisor", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0981', title: "MAGTF Enlisted Instructor", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0987', title: "Exercise Controller", field: "OccFld 09 Training", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '0930', title: "Range Officer", field: "OccFld 09 Training", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '0952', title: "Formal School Officer Instructor", field: "OccFld 09 Training", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '0982', title: "MAGTF Officer Instructor", field: "OccFld 09 Training", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '0988', title: "Exercise Instructor", field: "OccFld 09 Training", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '0919', title: "Force Fitness Instructor Officer", field: "OccFld 09 Training", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0942', title: "Winter Mountain Leader", field: "OccFld 09 Training", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0944', title: "Summer Mountain Leader", field: "OccFld 09 Training", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0946', title: "Summer/Winter Mountain Leader (SWML)", field: "OccFld 09 Training", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '0952', title: "Formal School Officer Instructor", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0953', title: "Formal School Officer Instructor-Fixed Wing Pilot", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0954', title: "Formal School Officer Instructor-Naval Flight Officer", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0955', title: "Formal School Officer Instructor-Helicopter Pilot", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0956', title: "Formal School Instructor-Pilot/Naval Flight Officer", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0982', title: "MAGTF Officer Instructor", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0983', title: "MAGTF Officer Instructor-Fixed Wing Pilot", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0984', title: "MAGTF Officer Instructor-Naval Flight Officer", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0985', title: "MAGTF Officer Instructor-Helicopter Pilot", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0986', title: "MAGTF Instructor-Pilot/Naval Flight Officer", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '0988', title: "Exercise Instructor", field: "OccFld 09 Training", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '1141', title: "Electrician", field: "OccFld 11 Utilities", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1164', title: "Utilities Systems Technician", field: "OccFld 11 Utilities", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1169', title: "Utilities Chief", field: "OccFld 11 Utilities", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1171', title: "Water Support Technician", field: "OccFld 11 Utilities", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1120', title: "Utilities Officer (UO)", field: "OccFld 11 Utilities", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '1316', title: "Metal Worker", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1321', title: "Fabrication Specialist", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1341', title: "Engineer Equipment Mechanic", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1342', title: "Small Craft Mechanic", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1345', title: "Engineer Equipment Operator", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1349', title: "Engineer Equipment Chief", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1361', title: "Geospatial Engineer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1371', title: "Combat Engineer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1391', title: "Expeditionary Fuels Technician", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1392', title: "Petroleum Laboratory and Additization Specialist", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1310', title: "Engineer Equipment Officer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '1390', title: "Expeditionary Fuels Officer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '1302', title: "Combat Engineer Officer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1330', title: "Facilities Management Officer", field: "OccFld 13 Engineer, Construction, Facilities, and Equipment", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '1712', title: "Interactive On-Net Operator", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1713', title: "Exploitation Analyst", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1721', title: "Cyberspace Warfare Operator", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1722', title: "Host Analyst", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1723', title: "Network Analyst", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1732', title: "Civil Affairs Specialist", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1739', title: "Civil-Military Operations (CMO) Chief", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1751', title: "Influence Specialist", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1757', title: "Military Deception Chief", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '1762', title: "System Operator", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1766', title: "Radio Frequency Operator", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1795', title: "Influence Chief", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1799', title: "Cyberspace Warfare Chief", field: "OccFld 17 Information Maneuver", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1710', title: "Offensive Cyberspace Warfare Officer", field: "OccFld 17 Information Maneuver", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '1720', title: "Defensive Cyberspace Weapons Officer", field: "OccFld 17 Information Maneuver", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '1702', title: "Cyberspace Warfare Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1704', title: "Electromagnetic Spectrum Operations (EMSO) Planner", field: "OccFld 17 Information Maneuver", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '1705', title: "Cyberspace Warfare Development Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1706', title: "Maritime Space Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1707', title: "Influence Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1708', title: "Civil-Military Operations (CMO) Planner", field: "OccFld 17 Information Maneuver", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '1709', title: "Information Cell Coordinator (ICC)", field: "OccFld 17 Information Maneuver", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '1730', title: "Civil Affairs Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '1757', title: "Military Deception Planner", field: "OccFld 17 Information Maneuver", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '1760', title: "Maritime Space Operations Mission Commander", field: "OccFld 17 Information Maneuver", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '1781', title: "Basic Information Planner", field: "OccFld 17 Information Maneuver", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '1786', title: "Space Operations Staff Officer", field: "OccFld 17 Information Maneuver", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '1812', title: "Armor Marine", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1833', title: "Assault Amphibious Vehicle (AAV) Crewmember", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1834', title: "Amphibious Combat Vehicle (ACV) Crewmember", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1867', title: "M1A1 Tank Master Gunner", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1868', title: "Assault Amphibious Master Gunner", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '1869', title: "Senior Armor SNCO", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '1802', title: "Tank Officer", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '1803', title: "Assault Amphibian (AA) Officer", field: "OccFld 18 Tank, Assault Amphibious Vehicle and Amphibious Combat Vehicle", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '2111', title: "Small Arms Repairer/Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2112', title: "Precision Weapons Repairer/Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2131', title: "Artillery Systems Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2141', title: "Assault Amphibious Vehicle (AAV)/Assault Combat Vehicle (ACV) Repairer/Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2143', title: "Amphibious Combat Vehicle (ACV) Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2147', title: "Light Armored Vehicle (LAV) Repairer/Technician", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2149', title: "Ordnance Vehicle Maintenance Chief", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2161', title: "Machinist", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2171', title: "Electro-Optical Ordnance Repairer", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2181', title: "Ground Ordnance Weapons Chief", field: "OccFld 21 Ground Ordnance Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2110', title: "Ordnance Vehicle Maintenance Officer", field: "OccFld 21 Ground Ordnance Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2120', title: "Ground Ordnance Maintenance Officer", field: "OccFld 21 Ground Ordnance Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2102', title: "Ordnance Officer", field: "OccFld 21 Ground Ordnance Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '2311', title: "Ammunition Technician", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2336', title: "Explosive Ordnance Disposal (EOD) Technician", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2339', title: "Marine EOD Diver", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2305', title: "Explosive Ordnance Disposal Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2339', title: "Marine EOD Diver Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '2340', title: "Ammunition Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2305', title: "Explosive Ordnance Disposal Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '2339', title: "Marine EOD Diver Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '2340', title: "Ammunition Officer", field: "OccFld 23 Ammunition and Explosive Ordnance Disposal", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '2611', title: "Cryptologic Cyberspace Analyst", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2621', title: "Communications Intelligence/Electromagnetic Warfare Operator", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2623', title: "Radio Reconnaissance Marine", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2629', title: "Signals Intelligence/Electromagnetic Warfare Technician", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2631', title: "Electronic Intelligence/Electromagnetic Warfare Analyst", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2641', title: "Cryptologic Language Analyst", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2642', title: "Advanced Cryptologic Language Analyst", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2651', title: "Intelligence Surveillance Reconnaissance (ISR) Systems Engineer", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2652', title: "Intelligence Data and Software Engineer", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2659', title: "Intelligence Data and Technology Chief", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2691', title: "Signals Intelligence/Electromagnetic Warfare Chief", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2602', title: "Signals Intelligence/Electromagnetic Warfare Operations Officer", field: "OccFld 26 Signals Intelligence/Electronic Warfare/Cyberspace Operations", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2712', title: "Arabic (Modern Standard)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2713', title: "Arabic (Egyptian)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2714', title: "Arabic (Syrian)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2715', title: "Arabic (Levantine)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2716', title: "Amharic", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2717', title: "Arabic (Maghrebi)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2718', title: "Hebrew", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2721', title: "Kurdish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2723', title: "Somali", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2724', title: "Swahili", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2726', title: "Turkish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2728', title: "Arabic (Iraqi)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2729', title: "Arabic (Algerian)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2730', title: "Arabic (Yemeni)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2731', title: "Arabic (Libyan)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2733', title: "Burmese", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2734', title: "Cambodian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2735', title: "Cebuano", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2736', title: "Chinese (Cantonese)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2737', title: "Chinese (Mandarin)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2738', title: "Indonesian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2739', title: "Japanese", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2740', title: "Maguindanao", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2741', title: "Korean", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2742', title: "Laotian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2743', title: "Malay", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2744', title: "Tagalog", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2745', title: "Tausug", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2746', title: "Thai", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2747', title: "Vietnamese", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2748', title: "Maranao", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2749', title: "Yakan", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2754', title: "Dutch", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2756', title: "Finnish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2757', title: "French", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2758', title: "German", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2759', title: "Greek", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2761', title: "Haitian-Creole", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2763', title: "Italian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2764', title: "Norwegian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2766', title: "Portuguese (Brazilian)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2767', title: "Portuguese (European)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2768', title: "Spanish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2769', title: "Swedish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2772', title: "Afghan Pushtu", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2773', title: "Persian Afghan (Dari)", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2774', title: "Persian-Farsi", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2775', title: "Urdu", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2776', title: "Albanian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2777', title: "Armenian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2778', title: "Bulgarian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2779', title: "Czech", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2780', title: "Uzbek", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2781', title: "Estonian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2782', title: "Georgian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2783', title: "Hungarian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2784', title: "Latvian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2785', title: "Azerbaijani", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2786', title: "Lithuanian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2787', title: "Macedonian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2788', title: "Polish", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2789', title: "Romanian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2791', title: "Russian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2792', title: "Serbo-Croatian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2793', title: "Slovenian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2794', title: "Ukrainian", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2795', title: "Hindi", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2796', title: "Bengali", field: "OccFld 27 Linguist", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '2712', title: "Arabic (Modern Standard)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2713', title: "Arabic (Egyptian)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2714', title: "Arabic (Syrian)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2715', title: "Arabic (Levantine)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2716', title: "Amharic", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2717', title: "Arabic (Maghrebi)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2718', title: "Hebrew", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2721', title: "Kurdish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2723', title: "Somali", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2724', title: "Swahili", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2726', title: "Turkish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2728', title: "Arabic (Iraqi)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2729', title: "Arabic (Algerian)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2730', title: "Arabic (Yemeni)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2731', title: "Arabic (Libyan)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2733', title: "Burmese", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2734', title: "Cambodian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2735', title: "Cebuano", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2736', title: "Chinese (Cantonese)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2737', title: "Chinese (Mandarin)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2738', title: "Indonesian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2739', title: "Japanese", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2740', title: "Maguindanao", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2741', title: "Korean", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2742', title: "Laotian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2743', title: "Malay", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2744', title: "Tagalog", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2745', title: "Tausug", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2746', title: "Thai", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2747', title: "Vietnamese", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2748', title: "Maranao", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2749', title: "Yakan", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2754', title: "Dutch", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2756', title: "Finnish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2757', title: "French", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2758', title: "German", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2759', title: "Greek", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2761', title: "Haitian-Creole", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2763', title: "Italian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2764', title: "Norwegian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2766', title: "Portuguese (Brazilian)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2767', title: "Portuguese (European)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2768', title: "Spanish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2769', title: "Swedish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2772', title: "Afghan Pushtu", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2773', title: "Persian Afghan (Dari)", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2774', title: "Persian-Farsi", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2775', title: "Urdu", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2776', title: "Albanian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2777', title: "Armenian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2778', title: "Bulgarian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2779', title: "Czech", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2780', title: "Uzbek", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2781', title: "Estonian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2782', title: "Georgian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2783', title: "Hungarian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2784', title: "Latvian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2785', title: "Azerbaijani", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2786', title: "Lithuanian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2787', title: "Macedonian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2788', title: "Polish", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2789', title: "Romanian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2791', title: "Russian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2792', title: "Serbo-Croatian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2793', title: "Slovenian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2794', title: "Ukrainian", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2795', title: "Hindi", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2796', title: "Bengali", field: "OccFld 27 Linguist", category: 'warrant' }, // EMOS
  { branch: 'marine-corps', code: '2712', title: "Arabic (Modern Standard)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2713', title: "Arabic (Egyptian)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2714', title: "Arabic (Syrian)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2715', title: "Arabic (Levantine)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2716', title: "Amharic", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2717', title: "Arabic (Maghrebi)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2718', title: "Hebrew", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2721', title: "Kurdish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2723', title: "Somali", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2724', title: "Swahili", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2726', title: "Turkish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2728', title: "Arabic (Iraqi)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2729', title: "Arabic (Algerian)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2730', title: "Arabic (Yemeni)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2731', title: "Arabic (Libyan)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2733', title: "Burmese", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2734', title: "Cambodian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2735', title: "Cebuano", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2736', title: "Chinese (Cantonese)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2737', title: "Chinese (Mandarin)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2738', title: "Indonesian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2739', title: "Japanese", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2740', title: "Maguindanao", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2741', title: "Korean", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2742', title: "Laotian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2743', title: "Malay", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2744', title: "Tagalog", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2745', title: "Tausug", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2746', title: "Thai", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2747', title: "Vietnamese", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2748', title: "Maranao", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2749', title: "Yakan", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2754', title: "Dutch", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2756', title: "Finnish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2757', title: "French", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2758', title: "German", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2759', title: "Greek", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2761', title: "Haitian-Creole", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2763', title: "Italian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2764', title: "Norwegian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2766', title: "Portuguese (Brazilian)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2767', title: "Portuguese (European)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2768', title: "Spanish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2769', title: "Swedish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2772', title: "Afghan Pushtu", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2773', title: "Persian Afghan (Dari)", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2774', title: "Persian-Farsi", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2775', title: "Urdu", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2776', title: "Albanian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2777', title: "Armenian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2778', title: "Bulgarian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2779', title: "Czech", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2780', title: "Uzbek", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2781', title: "Estonian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2782', title: "Georgian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2783', title: "Hungarian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2784', title: "Latvian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2785', title: "Azerbaijani", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2786', title: "Lithuanian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2787', title: "Macedonian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2788', title: "Polish", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2789', title: "Romanian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2791', title: "Russian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2792', title: "Serbo-Croatian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2793', title: "Slovenian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2794', title: "Ukrainian", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2795', title: "Hindi", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2796', title: "Bengali", field: "OccFld 27 Linguist", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '2800', title: "Basic Ground Electronics Maintenance Marine", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '2831', title: "Digital Wideband Systems Maintainer", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2834', title: "Advanced Extremely High Frequency (AEHF) Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2841', title: "Ground Electronics Transmission Systems Maintainer", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2847', title: "Electro-Mechanical/Information and Communication Technology Maintainer", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2848', title: "Sensor Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '2862', title: "Ground Electronics Systems Maintenance Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2871', title: "Calibration Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2874', title: "Metrology Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2887', title: "Artillery Electronics Technician", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2891', title: "Ground Electronics Systems Maintenance Chief", field: "OccFld 28 Ground Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '2805', title: "Electronics Maintenance Officer (Ground)", field: "OccFld 28 Ground Electronics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '2802', title: "Electronics Maintenance Officer (Ground)", field: "OccFld 28 Ground Electronics Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '3043', title: "Supply Chain Specialist", field: "OccFld 30 Supply Chain Material Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3044', title: "Operational Contract Support (OCS) Specialist", field: "OccFld 30 Supply Chain Material Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3047', title: "Supply Chain Manager", field: "OccFld 30 Supply Chain Material Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3051', title: "Inventory Management Specialist", field: "OccFld 30 Supply Chain Material Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3010', title: "Ground Supply Chain Management Officer", field: "OccFld 30 Supply Chain Material Management", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '3002', title: "Ground Supply Officer", field: "OccFld 30 Supply Chain Material Management", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '3006', title: "Operational Contract Support (OCS) Officer", field: "OccFld 30 Supply Chain Material Management", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '3152', title: "Distribution Specialist", field: "OccFld 31 Distribution Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3102', title: "Distribution Management Officer", field: "OccFld 31 Distribution Management", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '3102', title: "Distribution Management Officer", field: "OccFld 31 Distribution Management", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '3372', title: "Marine Aide", field: "OccFld 33 Food Service", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3381', title: "Food Service Specialist", field: "OccFld 33 Food Service", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3302', title: "Food Service Officer", field: "OccFld 33 Food Service", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '3302', title: "Food Service Officer", field: "OccFld 33 Food Service", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '3432', title: "Finance Technician", field: "OccFld 34 Financial Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3451', title: "Financial Management Resource Analyst (FMRA)", field: "OccFld 34 Financial Management", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3402', title: "Finance Officer", field: "OccFld 34 Financial Management", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '3408', title: "Financial Management Resource Officer", field: "OccFld 34 Financial Management", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '3404', title: "Financial Management Officer", field: "OccFld 34 Financial Management", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '3521', title: "Automotive Maintenance Technician", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3524', title: "Fuel and Electrical Systems Technician", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3526', title: "Crash/Fire/Rescue Vehicle Technician", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3528', title: "Motor Transport Master Technician", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3529', title: "Motor Transport Maintenance Chief", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3531', title: "Motor Vehicle Operator", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3534', title: "Semitrailer Refueler Operator", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3536', title: "Vehicle Recovery Operator", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '3537', title: "Motor Transport Operations Chief", field: "OccFld 35 Motor Transport", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '3510', title: "Motor Transport Officer", field: "OccFld 35 Motor Transport", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '4133', title: "Marine Corps Community Services Marine", field: "OccFld 41 Marine Corps Community Services", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4130', title: "Marine Corps Community Services (MCCS) Officer", field: "OccFld 41 Marine Corps Community Services", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '4421', title: "Legal Services Specialist", field: "OccFld 44 Legal Support", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4422', title: "Legal Services Court Reporter", field: "OccFld 44 Legal Support", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '4430', title: "Legal Administrative Officer", field: "OccFld 44 Legal Support", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '4402', title: "Judge Advocate", field: "OccFld 44 Legal Support", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '4403', title: "Victims Legal Counsel", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4405', title: "Master of International Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4406', title: "Master of Environmental Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4407', title: "Master of Labor Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4408', title: "Master of Procurement Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4409', title: "Master of Criminal Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4410', title: "Master of Law (General)", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4411', title: "Military Judge", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4417', title: "Master of Cyber, Intelligence, and Information Law", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4450', title: "Litigator", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4451', title: "Senior Litigator", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4452', title: "Supervisory Litigator", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4453', title: "Expert Litigator", field: "OccFld 44 Legal Support", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4500', title: "Basic Communication Strategy and Operations Marine", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '4511', title: "Recruiting Station Marketing & Communication Marine", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '4512', title: "Combat Graphics Specialist", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4513', title: "Advanced Visual Information-Graphics Marine", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '4541', title: "Combat Photographer", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4543', title: "Advanced Visual Information-Photojournalism Marine", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '4571', title: "Combat Videographer", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4573', title: "Advanced Visual Information-Motion Media Marine", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '4591', title: "Communication Strategy and Operations Chief", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4503', title: "Visual Information Officer", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '4502', title: "Communication Strategy and Operations Officer", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '4505', title: "Communication Strategy and Operations Planner", field: "OccFld 45 Communication Strategy and Operations (COMMSTRAT)", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '4606', title: "Combat Artist (Officer)", field: "OccFld 46 Combat Camera (COMCAM)", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '4821', title: "Career Counselor", field: "OccFld 48 Recruiting and Retention", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '4810', title: "Career Recruiting Officer", field: "OccFld 48 Recruiting and Retention", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '4801', title: "Recruiting Officer-Marine Corps Total Force Expert-Recruiting Station Commanding Officer", field: "OccFld 48 Recruiting and Retention", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '4802', title: "Recruiting Officer-Operational Expert-Recruiting Station Executive/Operations Officer", field: "OccFld 48 Recruiting and Retention", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '4803', title: "Recruiting Officer-Officer Recruiting Expert-Recruiting Station Officer Selection Officer", field: "OccFld 48 Recruiting and Retention", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '4804', title: "Recruiting Officer-Multiple Tour Expert", field: "OccFld 48 Recruiting and Retention", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '5511', title: "Member, The President's Own, United States Marine Band", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5512', title: "Member, \"The Commandant's Own,\" U.S. Marine Drum & Bugle Corps", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5519', title: "Enlisted Bandleader", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5521', title: "Ensemble Leader", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5522', title: "Production Manager", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5523', title: "Instrument Repair Technician", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5524', title: "Musician", field: "OccFld 55 Music", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5526', title: "Musician, Oboe", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5528', title: "Musician, Bassoon", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5534', title: "Musician, Clarinet", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5536', title: "Musician, Flute/Piccolo", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5537', title: "Musician, Saxophone", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5541', title: "Musician, Trumpet", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5543', title: "Musician, Euphonium", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5544', title: "Musician, Horn", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5546', title: "Musician, Trombone", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5547', title: "Musician, Tuba/Sousaphone", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5548', title: "Musician, Electric Bass", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5563', title: "Musician, Percussion (Drums, Tympani, and Mallets)", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5565', title: "Musician, Piano", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5566', title: "Musician, Guitar", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5567', title: "Musician, Vocalist", field: "OccFld 55 Music", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5502', title: "Band Officer", field: "OccFld 55 Music", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5506', title: "Staff Officer, The President's Own, U.S. Marine Band", field: "OccFld 55 Music", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5507', title: "U.S. Marine Drum and Bugle Corps Officer", field: "OccFld 55 Music", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5502', title: "Band Officer", field: "OccFld 55 Music", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5505', title: "Director/Assistant Director, The President's Own, U.S. Marine Band", field: "OccFld 55 Music", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5506', title: "Staff Officer, The President's Own, U.S. Marine Band", field: "OccFld 55 Music", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5507', title: "U.S. Marine Drum and Bugle Corps Officer", field: "OccFld 55 Music", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5711', title: "Chemical, Biological, Radiological, and Nuclear (CBRN) Defense Specialist", field: "OccFld 57 Chemical, Biological, Radiological and Nuclear (CBRN) Defense", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5713', title: "Chemical, Biological, Radiological and Nuclear (CBRN) Responder", field: "OccFld 57 Chemical, Biological, Radiological and Nuclear (CBRN) Defense", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5769', title: "Chemical, Biological, Radiological and Nuclear (CBRN) Defense Chief", field: "OccFld 57 Chemical, Biological, Radiological and Nuclear (CBRN) Defense", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5702', title: "Chemical, Biological, Radiological and Nuclear (CBRN) Defense Officer", field: "OccFld 57 Chemical, Biological, Radiological and Nuclear (CBRN) Defense", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5811', title: "Military Police", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5812', title: "Military Working Dog Handler", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5813', title: "Traffic Management and Collision Investigator (TMCI)", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5814', title: "Physical Security Specialist", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5816', title: "Special Reaction Team (SRT) Member", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5819', title: "Military Police Investigator (MPI)", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5821', title: "Criminal Investigator (CID) Agent", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5822', title: "Forensic Psychophysiologist (Polygraph Examiner)", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5831', title: "Correction and Detention Specialist", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5832', title: "Correctional Counselor", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5804', title: "Corrections Officer", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5805', title: "Criminal Investigation Officer", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5803', title: "Military Police Officer", field: "OccFld 58 Military Police, Investigations, and Corrections", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5900', title: "Basic Electronics Maintenance Marine", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '5939', title: "Aviation Communication Systems Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5948', title: "Aviation RADAR Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5951', title: "Aviation Meteorological Equipment Technician, OMA/IMA", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5952', title: "Air Traffic Control Navigational Aids Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5953', title: "Air Traffic Control RADAR Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5954', title: "Air Traffic Control Communications Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5955', title: "Ground Control Station Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5959', title: "Air Traffic Control Systems Maintenance Chief", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5968', title: "Air Battle Management System Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5974', title: "Tactical Data Systems Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5976', title: "Marine Air Command and Control Maintenance Instructor (MMI)", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5977', title: "Weapons and Tactics Instructor Aviation Command & Control (AC2) Maintenance Chief", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '5979', title: "Tactical Air Operations/Air Defense Systems Technician", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5993', title: "Electronics Maintenance Chief (Aviation (C2))", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '5910', title: "Aviation Radar Systems Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5930', title: "Ground Based Air Defense (GBAD) Systems Integration Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5950', title: "Air Traffic Control Systems Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5970', title: "Tactical Data Systems Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '5977', title: "Weapons and Tactics Instructor Aviation Command & Control (AC2) Maintenance Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '5902', title: "Electronics Maintenance Officer Aviation Command and Control (C2)", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '5977', title: "Weapons and Tactics Instructor Aviation Command & Control (AC2) Maintenance Officer", field: "OccFld 59 Aviation Command and Control (C2) Electronics Maintenance", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6011', title: "Aviation Production Controller", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6012', title: "Aviation Maintenance Controller", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6016', title: "Collateral Duty Inspector", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6017', title: "Collateral Duty Quality Assurance Representative (CDQAR)", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6018', title: "Quality Assurance Representative (QAR)", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6019', title: "Aircraft Maintenance Chief", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6023', title: "Aircraft Power Plants Test Cell Operator", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6033', title: "Aircraft Nondestructive Inspection Technician", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6035', title: "Joint Strike Fighter (JSF) Maintenance Specialist", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6042', title: "Aviation Support Equipment Asset Manager", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6043', title: "Aircraft Welder", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6044', title: "Additive Manufacturing Specialist", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6046', title: "Aviation Maintenance Data Specialist", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6048', title: "Flight Equipment Technician", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6049', title: "Aviation Data Analyst", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6053', title: "CH 53K Maintenance Specialist", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6062', title: "Aircraft Intermediate Level Hydraulic/Pneumatic Mechanic", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6073', title: "Support Equipment Electrician/Refrigeration and Engine/Gas Turbine Technician", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6074', title: "Cryogenics Equipment Operator", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6092', title: "Aircraft Intermediate Level Structures Mechanic", field: "OccFld 60 Aircraft Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6004', title: "Aircraft Maintenance Engineer Officer", field: "OccFld 60 Aircraft Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '6077', title: "Weapons and Tactics Instructor", field: "OccFld 60 Aircraft Maintenance", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6002', title: "Aircraft Maintenance Officer", field: "OccFld 60 Aircraft Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6004', title: "Aircraft Maintenance Engineer Officer", field: "OccFld 60 Aircraft Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6044', title: "Additive Manufacturing Officer", field: "OccFld 60 Aircraft Maintenance", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6077', title: "Weapons and Tactics Instructor", field: "OccFld 60 Aircraft Maintenance", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6111', title: "Helicopter/Tiltrotor Mechanic-Trainee", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '6113', title: "Helicopter Mechanic, CH-53", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6114', title: "Helicopter Mechanic, UH/AH-1", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6116', title: "Tiltrotor Mechanic, MV-22", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6122', title: "Helicopter Power Plants Mechanic, T-58", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6123', title: "Helicopter Power Plants Mechanic, T-64", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6124', title: "Helicopter Power Plants Mechanic, T-400/T-700", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6132', title: "Helicopter/Tiltrotor Dynamic Components Mechanic", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6140', title: "Fixed-Wing Aircraft Loadmaster, C-40A", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6141', title: "Fixed-Wing Aircraft Crew Chief, C-40A", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6153', title: "Helicopter Airframe Mechanic, CH-53", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6154', title: "Helicopter Airframe Mechanic, UH/AH-1", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6156', title: "Tiltrotor Airframe Mechanic, MV-22", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6171', title: "Night Systems Instructor (NSI) Enlisted Aircrew", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6173', title: "Helicopter Crew Chief, CH-53", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6174', title: "Helicopter Crew Chief, UH-1", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6176', title: "Tiltrotor Crew Chief, MV-22", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6177', title: "Weapons and Tactics Crew Chief Instructor", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6178', title: "VH-60N Presidential Helicopter Crew Chief", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6181', title: "VH-92 Presidential Helicopter Crew Chief", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6199', title: "Enlisted Aircrew/Aerial Observer/Gunner", field: "OccFld 61 Aircraft Maintenance (Rotary-Wing)", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '6212', title: "Fixed-Wing Aircraft Mechanic, AV-8/TAV-8", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6214', title: "Unmanned Aircraft Mechanic, MQ-9", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6216', title: "Fixed-Wing Aircraft Mechanic, KC-130", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6217', title: "Fixed-Wing Aircraft Mechanic, F/A-18", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6218', title: "Fixed-Wing Aircraft Mechanic, F-35", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6222', title: "Fixed-Wing Aircraft Power Plants Mechanic, F-402", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6223', title: "Fixed-Wing Aircraft Power Plants Mechanic, J-52", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6226', title: "Fixed-Wing Aircraft Power Plants Mechanic, T-56", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6227', title: "Fixed-Wing Aircraft Power Plants Mechanic, F-404", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6242', title: "Fixed-Wing Aircraft Flight Engineer, KC-130", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6246', title: "Fixed-Wing Transport Aircraft Specialist, C-20", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6251', title: "Fixed-Wing Aircraft Airframe Mechanic-Trainee", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '6252', title: "Fixed-Wing Aircraft Airframe Mechanic, AV-8/TAV-8", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6256', title: "Fixed-Wing Aircraft Airframe Mechanic, KC-130", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6257', title: "Fixed-Wing Aircraft Airframe Mechanic, F/A-18", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6258', title: "Fixed-Wing Aircraft Airframe Mechanic, F-35", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6276', title: "Fixed-Wing Aircraft Loadmaster, KC-130", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6281', title: "Fixed-Wing Aircraft Safety Equipment Mechanic-Trainee", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '6282', title: "Fixed-Wing Aircraft Safety Equipment Mechanic, AV-8/TAV-8", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6286', title: "Fixed-Wing Aircraft Safety Equipment Mechanic, KC-130/V-22", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6287', title: "Fixed-Wing Aircraft Safety Equipment Mechanic, F/A-18", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6288', title: "Fixed-Wing Aircraft Safety Equipment Mechanic, F-35", field: "OccFld 62 Aircraft Maintenance (Fixed-Wing)", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6313', title: "Aircraft Communications/Navigation/Radar Systems Technician, EA-6", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6314', title: "Avionics Technician, Unmanned Aircraft System (UAS)", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6316', title: "Aircraft Communications/Navigation Systems Technician, KC-130", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6317', title: "Aircraft Communications/Navigation/Radar Systems Technician, F/A-18", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6323', title: "Aircraft Avionics Technician, CH-53", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6324', title: "Aircraft Avionics Technician, U/AH-1", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6326', title: "Aircraft Avionics Technician, V-22", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6332', title: "Aircraft Avionics Technician, AV-8B", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6333', title: "Aircraft Electrical Systems Technician, EA-6", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6336', title: "Aircraft Electrical Systems Technician, KC-130", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6337', title: "Aircraft Electrical Systems Technician, F/A-18", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6338', title: "Aircraft Avionics Technician, F-35", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6386', title: "Aircraft Electronic Countermeasures Systems Technician, EA-6B", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6391', title: "Avionics Chief", field: "OccFld 63 Organizational Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6302', title: "Avionics Officer", field: "OccFld 63 Organizational Avionics Maintenance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '6302', title: "Avionics Officer", field: "OccFld 63 Organizational Avionics Maintenance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6423', title: "Aviation Electronic Micro/Miniature Component and Cable Repair Technician, IMA", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6432', title: "Aircraft Electrical/Instrument/Flight Control Systems Technician, IMA", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6469', title: "Reconfigurable Transportable Consolidated Automated Support System (RTCASS) Technician, IMA", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6483', title: "Communication/Navigation/Cryptographic/Countermeasures Systems Technician, IMA", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6492', title: "Aviation Precision Measurement Equipment (PME) Calibration/ Repair Technician, IMA", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6499', title: "Mobile Facility Technician", field: "OccFld 64 Intermediate Avionics Maintenance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6516', title: "Ordnance Quality Assurance/Safety Observer", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6531', title: "Aircraft Ordnance Technician", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6541', title: "Aviation Ordnance Systems Technician", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6542', title: "Ammunition Inventory Management Specialist", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6577', title: "Aviation Ordnance Weapons and Tactics Instructor", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6591', title: "Aviation Ordnance Chief", field: "OccFld 65 Aviation Ordnance", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6502', title: "Aviation Ordnance Officer", field: "OccFld 65 Aviation Ordnance", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '6577', title: "Aviation Ordnance Weapons and Tactics Instructor", field: "OccFld 65 Aviation Ordnance", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6502', title: "Aviation Ordnance Officer", field: "OccFld 65 Aviation Ordnance", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6577', title: "Aviation Ordnance Weapons and Tactics Instructor", field: "OccFld 65 Aviation Ordnance", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6617', title: "Enlisted Aviation Logistician", field: "OccFld 66 Aviation Logistics", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6618', title: "Enlisted AIRSpeed Coordinator", field: "OccFld 66 Aviation Logistics", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6672', title: "Aviation Supply Specialist", field: "OccFld 66 Aviation Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6694', title: "Aviation Logistics Information Management System (ALIMS) Specialist", field: "OccFld 66 Aviation Logistics", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6604', title: "Aviation Supply Operations Officer", field: "OccFld 66 Aviation Logistics", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '6607', title: "Aviation Logistician", field: "OccFld 66 Aviation Logistics", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6608', title: "AIRSpeed Officer", field: "OccFld 66 Aviation Logistics", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6609', title: "Aviation Logistics Information Systems Advisor", field: "OccFld 66 Aviation Logistics", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6602', title: "Aviation Supply Officer", field: "OccFld 66 Aviation Logistics", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6607', title: "Aviation Logistician", field: "OccFld 66 Aviation Logistics", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6608', title: "AIRSpeed Officer", field: "OccFld 66 Aviation Logistics", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6609', title: "Aviation Logistics Information Systems Advisor", field: "OccFld 66 Aviation Logistics", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '6842', title: "METOC Analyst Forecaster", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '6862', title: "METOC Senior Forecaster", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6877', title: "Weapons and Tactics Instructor (WTI) METOC", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '6802', title: "Meteorological and Oceanographic (METOC) Services Officer", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '6877', title: "Weapons and Tactics Instructor (WTI) METOC", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '6802', title: "Meteorological and Oceanographic (METOC) Services Officer", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '6877', title: "Weapons and Tactics Instructor (WTI) METOC", field: "OccFld 68 Meteorological and Oceanographic (METOC) Services", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7011', title: "Expeditionary Airfield Systems Technician", field: "OccFld 70 Airfield Services", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7041', title: "Aviation Operations Specialist", field: "OccFld 70 Airfield Services", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7051', title: "Aircraft Rescue and Fire Fighting (ARFF) Specialist", field: "OccFld 70 Airfield Services", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7077', title: "Weapons and Tactics Instructor-Aviation Ground Support", field: "OccFld 70 Airfield Services", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7002', title: "Expeditionary Airfield and Emergency Services Officer", field: "OccFld 70 Airfield Services", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '7077', title: "Weapons and Tactics Instructor-Aviation Ground Support", field: "OccFld 70 Airfield Services", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '7077', title: "Weapons and Tactics Instructor-Aviation Ground Support", field: "OccFld 70 Airfield Services", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7212', title: "Low Altitude Air Defense (LAAD) Gunner", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7236', title: "Tactical Air Defense Controller", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7240', title: "Tactical Air Control Operator", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7242', title: "Air Support Operations Operator", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7251', title: "Air Traffic Controller-Trainee", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '7252', title: "Air Traffic Controller-Tower", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7253', title: "Air Traffic Controller-Radar Arrival/Departure Controller", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7254', title: "Air Traffic Controller-Radar Approach Controller", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7257', title: "Air Traffic Controller", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7276', title: "Low Altitude Air Defense (LAAD) Enhancement Training Instructor (LETI)", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7277', title: "Weapons and Tactics Instructor-Air Command and Control", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7291', title: "Senior Air Traffic Controller", field: "OccFld 72 Aviation Command and Control Operations", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7216', title: "Command and Control Interface Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '7277', title: "Weapons and Tactics Instructor-Air Command and Control", field: "OccFld 72 Aviation Command and Control Operations", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '7202', title: "Command and Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7204', title: "Low Altitude Air Defense Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7208', title: "Air Support Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7209', title: "Air Command and Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7210', title: "Air Defense Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7220', title: "Air Traffic Control Officer", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7276', title: "Low Altitude Air Defense (LAAD) Enhancement Training Instructor (LETI)", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7277', title: "Weapons and Tactics Instructor-Air Command and Control", field: "OccFld 72 Aviation Command and Control Operations", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7313', title: "Helicopter Specialist, AH-1Z/UH-1Y", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7314', title: "Sensor Operator (SO), MQ-9", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7316', title: "Small Unmanned Aircraft System (SUAS) Specialist", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7372', title: "Tactical Systems Operator/Mission Specialist", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '7377', title: "Weapons and Tactics Instructor (WTI) Unmanned Aircraft Systems", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '7380', title: "Tactical Systems Officer/Mission Specialist", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'warrant' }, // PMOS
  { branch: 'marine-corps', code: '7315', title: "Group 3 UAS MAGTF Officer", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7318', title: "VMU MQ-9 Officer", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7377', title: "Weapons and Tactics Instructor (WTI) Unmanned Aircraft Systems Officer", field: "OccFld 73 Navigators and Unmanned Aircraft System Officers/Operators", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7502', title: "Forward Air Controller/Air Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7503', title: "Billet Designator-Fixed-Wing Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7504', title: "Billet Designator-Naval Flight Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7505', title: "Billet Designator-Helicopter Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7506', title: "Billet Designator-Any Pilot/Naval Flight Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7507', title: "Pilot VMA FRD Basic AV-8B Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7509', title: "Pilot VMA AV-8B Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7511', title: "Pilot Helicopter CH-53K", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7513', title: "Pilot Helicopter AH-1Z/UH-1Y", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7516', title: "Pilot VMFA FRS Basic F-35B Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7517', title: "VH-92, Presidential Helicopter Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7518', title: "Pilot VMFA FRS F-35B Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7521', title: "Pilot VMFA FRS Basic F/A-18 Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7523', title: "Pilot VMFA F/A-18 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7524', title: "Naval Flight Officer (NFO) FRS Basic F/A-18D Weapons Systems Officer (WSO)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7525', title: "Naval Flight Officer (NFO) Qualified F/A-18D Weapons Systems Officer (WSO)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7531', title: "Pilot VMM FRS Basic V-22 Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7532', title: "Pilot VMM V-22 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7533', title: "Aircraft Section Lead (SL)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7534', title: "Aircraft Division Lead (DL) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7535', title: "Flight Leader (FL) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7536', title: "AV-8B Weapons Training Officer (WTO) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7537', title: "Marine Division Tactics Instructor (MDTI)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7538', title: "EA-6B Defensive Tactics Instructor (DEFTACTI) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7539', title: "AV-8B Air Combat Tactics Instructor (ACTI) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7540', title: "Pilot VMR C-40A Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7542', title: "Strike Fighter Tactics Instructor", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7543', title: "Pilot VMAQ EA-6B Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7544', title: "Forward Air Controller (Airborne) Instructor (FAC(A)I) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7547', title: "Night Systems Instructor (NSI) Qualification", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7551', title: "Pilot VMR C-9 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7553', title: "Pilot VMR C-20/C-37 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7554', title: "Pilot VMR UC-35 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7555', title: "Pilot VMR UC-12F/M/W Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7556', title: "Pilot VMGR KC-130 Co-Pilot (T2P/T3P)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7557', title: "Pilot VMGR KC-130 Aircraft Commander", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7560', title: "Pilot HMH FRS Basic/CH-53E Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7562', title: "Pilot HMH/M/L/A CH-46 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7563', title: "Pilot HMLA UH-1Y Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7564', title: "Pilot HMH CH-53D Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7565', title: "Pilot HMLA AH-1 Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7566', title: "Pilot HMH CH-53E Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7567', title: "Pilot HMLA FRS Basic UH-1Y", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7568', title: "Pilot HMLA FRS Basic AH-1", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7570', title: "VH-60N Presidential Helicopter Pilot Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7571', title: "VH-3D Presidential Helicopter Pilot Qualified", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7573', title: "Strategic Refueling Area Commander (STRATRAC)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7577', title: "Weapons and Tactics Instructor", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7578', title: "Naval Flight Officer (NFO) Student (TBS)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7580', title: "Naval Flight Officer (NFO) Tactical Navigator Flight Student (NATC)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7588', title: "Naval Flight Officer (NFO) Qualified EA-6B Electronic Warfare Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7589', title: "V/STOL Training Landing Signal Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7591', title: "Short Takeoff and Vertical Landing (STOVL) Training Landing Signal Officer (TLSO)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '7594', title: "Landing Signal Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7595', title: "Test Pilot/Flight Test Project Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7596', title: "Aviation Safety Officer", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '7597', title: "Basic Rotary Wing Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7598', title: "Basic Fixed-Wing Pilot", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '7599', title: "Flight Student (TBS)", field: "OccFld 75 Pilots/Naval Flight Officers", category: 'officer' }, // BMOS
  { branch: 'marine-corps', code: '8000', title: "General Service Marine", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '8002', title: "Joint Terminal Attack Controller (JTAC)", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8011', title: "Basic Marine with Enlistment Guarantee", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '8012', title: "Ground Safety Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8013', title: "Special Assignment-Enlisted", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8014', title: "Billet Designator-Enlisted", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8015', title: "College Degree-Enlisted", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8016', title: "Special Technical Operations (STO) Administrator", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8018', title: "Congressional Marine Liaison", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8020', title: "Combat Rubber Reconnaissance Craft (CRRC) Coxswain", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8021', title: "Blackjack (MQ-21) Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8022', title: "Reaper (MQ-9) Sensor Operator", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8023', title: "Parachutist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8024', title: "Combatant Diver Marine", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8026', title: "Parachutist/Combatant Diver Marine", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8028', title: "Marine Enlisted Commissioning Education Program Participants (MECEP)", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8036', title: "Joint Targeting Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8050', title: "Inspector General Professional", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8056', title: "Hazardous Material/Hazardous Waste (HM/HW) Staff Noncommissioned Officer/Noncommissioned Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8060', title: "Acquisition Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8071', title: "Special Operations Capability Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8010', title: "Billet Designator-Warrant Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '8023', title: "Parachutist Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'warrant' }, // NMOS
  { branch: 'marine-corps', code: '8056', title: "Hazardous Material/Hazardous Waste (HM/HW) Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '8060', title: "Acquisition Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '8077', title: "Weapons and Tactics Instructor-Air Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '8001', title: "Basic Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // BMOS
  { branch: 'marine-corps', code: '8002', title: "Joint Terminal Attack Controller (JTAC)", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '8003', title: "General Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8005', title: "Special Assignment Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8006', title: "Billet Designator-Unrestricted Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8007', title: "Billet Designator-Unrestricted Ground Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8008', title: "GCE Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8009', title: "Billet Designator-Air Control/Anti-Air Warfare Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8012', title: "Ground Safety Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8016', title: "Special Technical Operations (STO) Planner", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8017', title: "Billet Designator-Unrestricted Information Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // EMOS
  { branch: 'marine-corps', code: '8018', title: "Congressional Marine Liaison", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8021', title: "Blackjack (MQ-21) Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '8023', title: "Parachutist Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '8024', title: "Combatant Diver Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '8026', title: "Parachutist/Combatant Diver Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // NMOS
  { branch: 'marine-corps', code: '8040', title: "Colonel, Sustainment", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8041', title: "Colonel, Ground Maneuver and Fires", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8042', title: "Colonel, Aviation Fires Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8043', title: "Colonel, Information, Intel, and Command and Control (I2C2)", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8044', title: "Colonel, Command Element", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8049', title: "Inspector General Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8051', title: "Operations Research Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8055', title: "Knowledge Management Officer (KMO)", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8056', title: "Hazardous Material/Hazardous Waste (HM/HW) Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8057', title: "Marine Acquisition Officer Candidate", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8058', title: "Department of the Navy Acquisition Professional Member", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8059', title: "Marine Acquisition Officer-Aviation", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8060', title: "Acquisition Specialist", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8061', title: "Marine Acquisition Officer-Ground", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // PMOS
  { branch: 'marine-corps', code: '8077', title: "Weapons and Tactics Instructor-Air Officer", field: "OccFld 80 Miscellaneous Requirements MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8151', title: "Guard", field: "OccFld 81 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8152', title: "Marine Corps Security Force (MCSF) Guard", field: "OccFld 81 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8154', title: "Marine Corps Security Force (MCSF) Close Quarters Battle (CQB) Team Member", field: "OccFld 81 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8156', title: "Marine Security Guard (MSG)", field: "OccFld 81 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8157', title: "Career Detachment Commander", field: "OccFld 81 Miscellaneous Requirement MOS", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '8230', title: "Foreign Area Staff Non-Commissioned Officer Basic/In-Training Foreign Area SNCO", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8231', title: "Foreign Area Staff Non-Commissioned Officer-Latin America", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8232', title: "Foreign Area Staff Non-Commissioned Officer-Europe", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8233', title: "Foreign Area Staff Non-Commissioned Officer-Indo-Pacific", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8234', title: "Foreign Area Staff Non-Commissioned Officer-Middle East", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8235', title: "Foreign Area Staff Non-Commissioned Officer-Africa", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8236', title: "Foreign Area Staff Non-Commissioned Officer-South Asia", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8237', title: "Foreign Area Staff Non-Commissioned Officer-Europe", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8238', title: "Foreign Area Staff Non-Commissioned Officer-Southeast Asia", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8299', title: "Intelligence Senior Enlisted Leader (ISEL)", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8220', title: "Billet Designator-Political Military Officer", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8221', title: "Regional Affairs Officer-Latin America", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8222', title: "Regional Affairs Officer-Europe", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8223', title: "Regional Affairs Officer-Indo-Pacific", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8224', title: "Regional Affairs Officer-Middle East", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8225', title: "Regional Affairs Officer-Africa", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8226', title: "Regional Affairs Officer-South Asia", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8227', title: "Regional Affairs Officer-Europe", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8228', title: "Regional Affairs Officer-Southeast Asia", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8240', title: "Basic Foreign Area Officer (FAO)", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8241', title: "Foreign Area Officer-Latin America", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8242', title: "Foreign Area Officer-Europe", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8243', title: "Foreign Area Officer Indo-Pacific", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8244', title: "Foreign Area Officer-Middle East", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8245', title: "Foreign Area Officer-Africa", field: "OccFld 82 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8411', title: "Recruiter", field: "OccFld 84 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8412', title: "Career Recruiter", field: "OccFld 84 Miscellaneous Requirement MOS", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '8421', title: "Production Recruiter", field: "OccFld 84 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8422', title: "Career Prior Service Recruiter", field: "OccFld 84 Miscellaneous Requirement MOS", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '8621', title: "Surveillance Sensor Operator", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8623', title: "Small Unmanned Aircraft System Operator", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8640', title: "Requirements Manager", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8641', title: "Micro-Miniature Repairer", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8640', title: "Requirements Manager", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'warrant' }, // FMOS
  { branch: 'marine-corps', code: '8623', title: "Small Unmanned Aircraft System Operator", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8640', title: "Requirements Manager", field: "OccFld 86 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8711', title: "Ground Command and Control (C2) Operations NCO", field: "OccFld 87 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8713', title: "Maneuver Warfare Specialist (MWS)", field: "OccFld 87 Miscellaneous Requirement MOS", category: 'enlisted' }, // EMOS
  { branch: 'marine-corps', code: '8870', title: "Special Operations Concepts and Strategy Specialist", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'enlisted' }, // NMOS
  { branch: 'marine-corps', code: '8878', title: "Historian", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8802', title: "Training and Education Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8803', title: "Leadership Development Specialist", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8816', title: "Defense Systems Acquisition Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8820', title: "Aeronautical Engineer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8824', title: "Electronics Engineer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8825', title: "Modeling and Simulation Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8826', title: "Ordnance Systems Engineer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8831', title: "Environmental Engineering Management Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8832', title: "Nuclear Engineer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8834', title: "Technical Information Operations Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8840', title: "Manpower Management Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8844', title: "Financial Management Specialist", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8846', title: "Data Systems Specialist", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8848', title: "Information Systems Manager", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8850', title: "Operations Analyst", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8852', title: "Defense Systems Analyst", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8858', title: "Command, Control, Communications, Computers and Intelligence (C4I) Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8862', title: "Material Management Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8866', title: "Space Operations Officer", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8870', title: "Special Operations Concepts and Strategy Specialist", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8878', title: "Historian", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8890', title: "Doctor of Philosophy, Technical", field: "OccFld 88 Miscellaneous Requirement MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '8910', title: "GCE Marine", field: "OccFld 89 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8911', title: "Billet Designator-Barracks and Grounds Marine", field: "OccFld 89 Miscellaneous Requirement MOS", category: 'enlisted' }, // FMOS
  { branch: 'marine-corps', code: '8972', title: "Aircrew Trainee", field: "OccFld 89 Miscellaneous Requirement MOS", category: 'enlisted' }, // BMOS
  { branch: 'marine-corps', code: '8991', title: "Sergeant Major of the Marine Corps", field: "OccFld 89 Miscellaneous Requirement MOS", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '8999', title: "Sergeant Major-First Sergeant", field: "OccFld 89 Miscellaneous Requirement MOS", category: 'enlisted' }, // PMOS
  { branch: 'marine-corps', code: '9701', title: "Joint Level II Officer", field: "OccFld 97 Reporting MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '9702', title: "Joint Qualified Officer (JQO)", field: "OccFld 97 Reporting MOS", category: 'officer' }, // FMOS
  { branch: 'marine-corps', code: '9703', title: "Level IV Joint Qualified Officer", field: "OccFld 97 Reporting MOS", category: 'officer' }, // FMOS
];

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'NAVMC 1200.1M, Military Occupational Specialties Manual (FY2027), 2 Mar 2026',
      url: 'https://www.marines.mil/Portals/1/Publications/NAVMC%201200.1M%20(SECURED).pdf',
    },
    {
      label: 'NAVMC 1200.1M library entry (Marine Corps Publications Electronic Library)',
      url: 'https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/4429151/navmc-12001m/',
    },
    {
      label: 'MARADMIN 122/26, FY2027 MOS Manual changes implementation',
      url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4441349/fiscal-year-2027-military-occupational-specialties-manual-changes-implementation/',
    },
  ],
  notes:
    'FY2027 MOS Manual (NAVMC 1200.1M), in effect from 1 Oct 2026. 868 MOS entries: 378 in the officer chapter, 490 in the enlisted chapter. Enlisted MOS 2146 was deleted in this edition and is not listed. Two OccFld names are printed with typos in the manual and are corrected here: OccFld 26 "CYCBERSPACE" (Cyberspace) and OccFld 61 "ROTORY-WING" (Rotary-Wing). The manual still carries some MOSs for retired aircraft (for example EA-6B, CH-46, CH-53D); they are kept because they are in the current edition. Rows were extracted from the PDF text by script, so a title that ran over a line break could be cut short.',
  unverified: [
    'Spot-check a sample of titles against NAVMC 1200.1M, Chapters 1 and 3. Rows were extracted from the PDF text by script.',
    'Product decision: officer-chapter MOSs open to both commissioned and warrant officers (105 codes, e.g. 0277, 2305, the 27xx linguist MOSs) are listed twice, once as officer and once as warrant. Decide whether to keep both rows or show one.',
    'Product decision: non-primary MOSs (NMOS, FMOS, EMOS, about 600 rows) are included alongside PMOS. The Job type has no MOS-type field, so the type is only in a code comment. Decide whether the page should show only PMOS.',
  ],
};
