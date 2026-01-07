import puppeteer from 'puppeteer';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://apttp.onrender.com/api';
const CSIR_URL = 'https://techindiacsir.anusandhan.net/online/Control.do?_tech=';

// Full list of IDs (same as in batch_scrape.ts)
const allIds = ["T-1411", "T-1410", "T-1298", "T-958", "T-1524", "T-1542", "T-1543", "T-1541", "T-1540", "T-1539", "T-1729", "T-1121", "T-1771", "T-1438", "T-1761", "T-596", "T-493", "T-1243", "T-1728", "T-1720", "T-1245", "T-1800", "T-1725", "T-1742", "T-1655", "T-1466", "T-1464", "T-681", "T-939", "T-1465", "T-526", "T-865", "T-1794", "T-882", "T-1620", "T-1716", "T-1690", "T-835", "T-1396", "T-1467", "T-1780", "T-1770", "T-508", "T-900", "T-291", "T-1282", "T-992", "T-1412", "T-42", "T-1157", "T-1682", "T-1694", "T-1476", "T-942", "T-1477", "T-1362", "T-321", "T-43", "T-1251", "T-1744", "T-1143", "T-629", "T-1665", "T-1667", "T-1666", "T-1663", "T-941", "T-1596", "T-824", "T-1580", "T-730", "T-1436", "T-1365", "T-1087", "T-1093", "T-1784", "T-1136", "T-741", "T-1425", "T-1601", "T-743", "T-1283", "T-737", "T-739", "T-963", "T-1210", "T-1138", "T-1343", "T-1211", "T-1639", "T-1640", "T-1270", "T-1271", "T-738", "T-1123", "T-1572", "T-1749", "T-1074", "T-1703", "T-1307", "T-967", "T-968", "T-970", "T-1116", "T-1576", "T-1030", "T-1710", "T-1377", "T-1733", "T-710", "T-1340", "T-735", "T-972", "T-1573", "T-720", "T-822", "T-1419", "T-1127", "T-1070", "T-721", "T-1254", "T-1505", "T-818", "T-1483", "T-1089", "T-1651", "T-1403", "T-981", "T-853", "T-1285", "T-722", "T-1429", "T-1257", "T-1090", "T-1606", "T-1484", "T-1374", "T-1578", "T-960", "T-1375", "T-1049", "T-1076", "T-1031", "T-1513", "T-1471", "T-888", "T-984", "T-723", "T-1475", "T-983", "T-1610", "T-1291", "T-1135", "T-1613", "T-1212", "T-1731", "T-931", "T-724", "T-1312", "T-1128", "T-901", "T-902", "T-1085", "T-586", "T-820", "T-1256", "T-1196", "T-1387", "T-1709", "T-904", "T-1058", "T-1773", "T-1083", "T-1577", "T-1213", "T-1486", "T-1286", "T-1264", "T-1288", "T-1614", "T-716", "T-1730", "T-1796", "T-1797", "T-1565", "T-1402", "T-1786", "T-1117", "T-930", "T-1437", "T-1482", "T-1586", "T-1587", "T-1648", "T-1496", "T-1010", "T-1223", "T-1428", "T-1783", "T-1120", "T-1498", "T-1705", "T-1435", "T-1788", "T-1789", "T-1114", "T-1603", "T-1700", "T-1790", "T-1269", "T-1296", "T-1069", "T-1302", "T-819", "T-1759", "T-1758", "T-1757", "T-1479", "T-1293", "T-982", "T-1581", "T-1638", "T-1053", "T-1140", "T-1432", "T-1431", "T-1598", "T-1588", "T-1755", "T-1781", "T-1756", "T-1072", "T-1303", "T-1240", "T-1025", "T-1319", "T-1316", "T-969", "T-1325", "T-1301", "T-966", "T-1472", "T-962", "T-1492", "T-1050", "T-1745", "T-1760", "T-1712", "T-1005", "T-1430", "T-1511", "T-909", "T-1409", "T-1706", "T-1555", "T-1600", "T-1605", "T-1723", "T-1724", "T-1787", "T-1404", "T-623", "T-1779", "T-1071", "T-1595", "T-921", "T-1798", "T-1739", "T-1494", "T-1258", "T-1259", "T-1491", "T-1287", "T-1384", "T-1290", "T-1646", "T-1583", "T-1289", "T-1214", "T-1503", "T-692", "T-1597", "T-1585", "T-1320", "T-935", "T-1711", "T-1284", "T-727", "T-1297", "T-1013", "T-1506", "T-1499", "T-1584", "T-1086", "T-1306", "T-1582", "T-1242", "T-1752", "T-1751", "T-1750", "T-1753", "T-1318", "T-1036", "T-1079", "T-1292", "T-933", "T-1383", "T-1714", "T-620", "T-1126", "T-1378", "T-887", "T-1702", "T-1704", "T-718", "T-1590", "T-1579", "T-1078", "T-1073", "T-1708", "T-1075", "T-1418", "T-1353", "T-1433", "T-1249", "T-1294", "T-1434", "T-1019", "T-1266", "T-1495", "T-1080", "T-1305", "T-1762", "T-964", "T-1754", "T-1782", "T-1501", "T-1612", "T-1562", "T-289", "T-1124", "T-1225", "T-826", "T-823", "T-1574", "T-1324", "T-1480", "T-1407", "T-1119", "T-1563", "T-1732", "T-971", "T-1502", "T-1670", "T-286", "T-1141", "T-447", "T-1426", "T-1125", "T-1408", "T-1427", "T-1351", "T-1489", "T-1592", "T-1082", "T-1642", "T-1643", "T-1641", "T-938", "T-817", "T-1653", "T-1098", "T-1764", "T-908", "T-989", "T-1652", "T-1715", "T-1645", "T-1650", "T-1551", "T-1216", "T-1401", "T-906", "T-907", "T-1040", "T-1224", "T-1785", "T-1713", "T-1055", "T-1717", "T-905", "T-1094", "T-1420", "T-1589", "T-1035", "T-1647", "T-1207", "T-1604", "T-1490", "T-1205", "T-1137", "T-1199", "T-1197", "T-1748", "T-731", "T-1766", "T-1743", "T-1687", "T-1602", "T-1763", "T-1195", "T-1799", "T-712", "T-713", "T-1487", "T-809", "T-1139", "T-711", "T-1051", "T-1014", "T-1776", "T-1265", "T-1044", "T-1041", "T-1042", "T-925", "T-911", "T-1493", "T-1726", "T-1727", "T-1792", "T-932", "T-910", "T-1478", "T-1575", "T-1746", "T-1363", "T-1567", "T-1707", "T-825", "T-1777", "T-1215", "T-827", "T-1295", "T-1314", "T-832", "T-1671", "T-1488", "T-1500", "T-903", "T-1037", "T-1593", "T-821", "T-1599", "T-1416", "T-1649", "T-1413", "T-973", "T-1077", "T-833", "T-965", "T-728", "T-918", "T-404", "T-1654", "T-176", "T-177", "T-1110", "T-1468", "T-1052", "T-1372", "T-1346", "T-1571", "T-1656", "T-431", "T-705", "T-1342", "T-1018", "T-377", "T-423", "T-422", "T-414", "T-472", "T-572", "T-1617", "T-138", "T-1102", "T-1658", "T-1662", "T-137", "T-893", "T-873", "T-41", "T-515", "T-1352", "T-1674", "T-1161", "T-323", "T-1530", "T-1699", "T-67", "T-1380", "T-1379", "T-1443", "T-632", "T-861", "T-864", "T-1218", "T-154", "T-61", "T-1385", "T-767", "T-768", "T-1169", "T-1168", "T-570", "T-516", "T-1534", "T-575", "T-407", "T-920", "T-673", "T-406", "T-385", "T-1344", "T-163", "T-1504", "T-345", "T-613", "T-410", "T-645", "T-675", "T-390", "T-380", "T-1062", "T-589", "T-349", "T-769", "T-262", "T-383", "T-153", "T-100", "T-374", "T-1100", "T-608", "T-1398", "T-777", "T-748", "T-1015", "T-568", "T-693", "T-440", "T-357", "T-439", "T-432", "T-805", "T-1337", "T-264", "T-927", "T-859", "T-732", "T-277", "T-573", "T-403", "T-402", "T-1060", "T-991", "T-776", "T-144", "T-653", "T-749", "T-615", "T-444", "T-199", "T-1300", "T-834", "T-275", "T-1527", "T-535", "T-1057", "T-1203", "T-945", "T-330", "T-471", "T-331", "T-485", "T-1661", "T-928", "T-1113", "T-1061", "T-2", "T-582", "T-538", "T-709", "T-707", "T-382", "T-914", "T-778", "T-88", "T-1323", "T-779", "T-898", "T-890", "T-1512", "T-891", "T-72", "T-293", "T-683", "T-876", "T-802", "T-297", "T-916", "T-1526", "T-1553", "T-858", "T-669", "T-384", "T-803", "T-780", "T-648", "T-71", "T-804", "T-425", "T-946", "T-445", "T-627", "T-533", "T-841", "T-840", "T-839", "T-842", "T-200", "T-750", "T-680", "T-747", "T-324", "T-831", "T-1455", "T-1446", "T-173", "T-988", "T-1190", "T-609", "T-539", "T-375", "T-268", "T-267", "T-409", "T-435", "T-592", "T-590", "T-595", "T-871", "T-1198", "T-892", "T-70", "T-73", "T-258", "T-256", "T-249", "T-250", "T-254", "T-255", "T-252", "T-251", "T-169", "T-1552", "T-771", "T-436", "T-781", "T-1485", "T-1023", "T-772", "T-342", "T-269", "T-844", "T-548", "T-279", "T-44", "T-1393", "T-947", "T-1392", "T-1520", "T-401", "T-1635", "T-136", "T-1388", "T-1537", "T-491", "T-954", "T-1386", "T-265", "T-1222", "T-637", "T-419", "T-1616", "T-929", "T-666", "T-1367", "T-1355", "T-272", "T-322", "T-273", "T-209", "T-614", "T-141", "T-391", "T-392", "T-616", "T-744", "T-899", "T-845", "T-843", "T-1158", "T-674", "T-320", "T-540", "T-603", "T-151", "T-285", "T-194", "T-193", "T-1088", "T-622", "T-1528", "T-813", "T-186", "T-1047", "T-1619", "T-1182", "T-1569", "T-753", "T-1474", "T-534", "T-581", "T-1697", "T-149", "T-1557", "T-1191", "T-1219", "T-1556", "T-594", "T-856", "T-430", "T-281", "T-664", "T-654", "T-657", "T-815", "T-157", "T-1644", "T-915", "T-672", "T-1458", "T-579", "T-617", "T-667", "T-66", "T-260", "T-1626", "T-145", "T-1349", "T-1371", "T-552", "T-389", "T-1445", "T-399", "T-679", "T-874", "T-1454", "T-1525", "T-567", "T-426", "T-76", "T-507", "T-263", "T-1029", "T-1631", "T-31", "T-591", "T-754", "T-755", "T-77", "T-347", "T-775", "T-806", "T-1546", "T-1680", "T-682", "T-191", "T-1678", "T-418", "T-48", "T-862", "T-1171", "T-1424", "T-1059", "T-1630", "T-411", "T-1001", "T-1695", "T-1356", "T-1389", "T-1111", "T-1", "T-1108", "T-560", "T-53", "T-889", "T-339", "T-143", "T-1091", "T-1315", "T-370", "T-350", "T-736", "T-369", "T-351", "T-641", "T-994", "T-808", "T-633", "T-660", "T-634", "T-636", "T-635", "T-348", "T-642", "T-346", "T-68", "T-343", "T-47", "T-1151", "T-837", "T-1149", "T-838", "T-593", "T-949", "T-4", "T-1701", "T-600", "T-745", "T-756", "T-694", "T-695", "T-437", "T-583", "T-1457", "T-1390", "T-996", "T-1510", "T-1395", "T-990", "T-1517", "T-395", "T-181", "T-569", "T-1509", "T-866", "T-1009", "T-1096", "T-1623", "T-1672", "T-1440", "T-624", "T-606", "T-670", "T-863", "T-610", "T-283", "T-284", "T-702", "T-1615", "T-940", "T-1345", "T-576", "T-1027", "T-584", "T-1033", "T-1515", "T-160", "T-164", "T-1451", "T-686", "T-1444", "T-1326", "T-760", "T-761", "T-376", "T-587", "T-1417", "T-172", "T-1570", "T-1221", "T-129", "T-155", "T-1669", "T-1668", "T-1529", "T-1064", "T-1067", "T-1406", "T-49", "T-1382", "T-1174", "T-1535", "T-1532", "T-1673", "T-855", "T-1423", "T-1399", "T-763", "T-1331", "T-1452", "T-1328", "T-1261", "T-1659", "T-87", "T-1376", "T-801", "T-150", "T-872", "T-344", "T-270", "T-518", "T-687", "T-1453", "T-1299", "T-1558", "T-381", "T-161", "T-1184", "T-640", "T-759", "T-1200", "T-517", "T-1134", "T-1691", "T-282", "T-788", "T-1657", "T-1189", "T-1201", "T-1519", "T-394", "T-397", "T-396", "T-1164", "T-658", "T-619", "T-457", "T-69", "T-378", "T-854", "T-829", "T-1220", "T-605", "T-638", "T-651", "T-379", "T-1679", "T-1688", "T-34", "T-1381", "T-951", "T-1142", "T-261", "T-1633", "T-400", "T-1310", "T-783", "T-202", "T-661", "T-1681", "T-192", "T-3", "T-703", "T-134", "T-294", "T-650", "T-166", "T-952", "T-729", "T-598", "T-980", "T-1192", "T-1568", "T-879", "T-877", "T-896", "T-371", "T-1308", "T-880", "T-1017", "T-1348", "T-1531", "T-1202", "T-1550", "T-1084", "T-784", "T-588", "T-1359", "T-290", "T-52", "T-148", "T-668", "T-276", "T-884", "T-319", "T-1024", "T-386", "T-1166", "T-604", "T-955", "T-295", "T-1208", "T-557", "T-1020", "T-558", "T-553", "T-944", "T-1621", "T-1227", "T-146", "T-1339", "T-1107", "T-1063", "T-999", "T-607", "T-544", "T-1188", "T-1611", "T-1012", "T-1397", "T-1311", "T-1004", "T-786", "T-1625", "T-1624", "T-787", "T-352", "T-203", "T-37", "T-1309", "T-758", "T-659", "T-807", "T-1278", "T-1263", "T-578", "T-773", "T-881", "T-883", "T-456", "T-547", "T-1081", "T-274", "T-1795", "T-1357", "T-135", "T-987", "T-1008", "T-1497", "T-417", "T-665", "T-424", "T-643", "T-442", "T-580", "T-943", "T-1414", "T-1336", "T-1561", "T-1591", "T-1335", "T-1629", "T-1627", "T-1628", "T-554", "T-551", "T-1450", "T-305", "T-708", "T-38", "T-479", "T-131", "T-1560", "T-886", "T-492", "T-405", "T-1508", "T-158", "T-1095", "T-152", "T-1636", "T-1439", "T-621", "T-1279", "T-159", "T-770", "T-597", "T-697", "T-167", "T-1518", "T-1405", "T-168", "T-174", "T-175", "T-259", "T-1400", "T-1677", "T-1664", "T-663", "T-684", "T-1045", "T-1608", "T-950", "T-995", "T-574", "T-333", "T-1006", "T-1170", "T-734", "T-1622", "T-188", "T-618", "T-1559", "T-527", "T-740", "T-1448", "T-183", "T-612", "T-1449", "T-1206", "T-867", "T-869", "T-1607", "T-1660", "T-1718", "T-117", "T-649", "T-688", "T-1719", "T-170", "T-184", "T-205", "T-1521", "T-662", "T-421", "T-415", "T-412", "T-171", "T-1634", "T-1536", "T-782", "T-248", "T-628", "T-1522", "T-785", "T-796", "T-1632", "T-798", "T-185", "T-700", "T-130", "T-307", "T-253", "T-280", "T-1065", "T-1304", "T-1066", "T-897", "T-195", "T-142", "T-162", "T-789", "T-1334", "T-1698", "T-1341", "T-7", "T-325", "T-1194", "T-1347", "T-1103", "T-1696", "T-577", "T-791", "T-792", "T-793", "T-794", "T-795", "T-790", "T-1255", "T-1028", "T-1547", "T-296", "T-428", "T-427", "T-689", "T-1273", "T-1394", "T-429", "T-1516", "T-482", "T-1272", "T-585", "T-562", "T-1618", "T-948", "T-101", "T-1684", "T-1217", "T-1683", "T-601", "T-156", "T-1564", "T-27", "T-924", "T-676", "T-857", "T-644", "T-913", "T-1046", "T-187", "T-1003", "T-979", "T-1637", "T-917", "T-797", "T-765", "T-546", "T-413", "T-828", "T-922", "T-6", "T-1026", "T-937", "T-65", "T-1507", "T-1364", "T-111", "T-519", "T-849", "T-1685", "T-39", "T-165", "T-696", "T-699", "T-556", "T-639", "T-1693", "T-646", "T-762", "T-706", "T-446", "T-353", "T-799", "T-1209", "T-1544", "T-139", "T-1054", "T-408", "T-764", "T-278", "T-545", "T-147", "T-757", "T-875", "T-266", "T-564", "T-1252", "T-35", "T-1566", "T-800", "T-210", "T-204", "T-206", "T-207", "T-308", "T-985", "T-1548", "T-611", "T-1462", "T-685", "T-1460", "T-1461", "T-599", "T-358", "T-1185", "T-1676", "T-566", "T-631", "T-630", "T-1538", "T-1459", "T-1523", "T-329", "T-1187", "T-208", "T-860", "T-1186", "T-363", "T-652", "T-360", "T-359", "T-986", "T-75", "T-364", "T-362", "T-361", "T-563", "T-182", "T-180", "T-1056", "T-190", "T-1447", "T-179", "T-189", "T-1133", "T-836", "T-1675", "T-555", "T-1183", "T-355", "T-766", "T-830", "T-953", "T-1442", "T-453", "T-814", "T-74", "T-211", "T-514", "T-1692", "T-812", "T-1360", "T-1317", "T-373", "T-733", "T-356", "T-201", "T-1193", "T-292", "T-1109", "T-398", "T-1369", "T-626", "T-549", "T-1322", "T-140", "T-1204", "T-1038", "T-1039", "T-1260", "T-1481", "T-671", "T-1533", "T-1032", "T-372", "T-647", "T-571", "T-656", "T-271", "T-1068", "T-1370", "T-1689", "T-8", "T-926", "T-90", "T-923", "T-340", "T-354", "T-393", "T-326", "T-1373", "T-40", "T-416", "T-912", "T-387", "T-388", "T-257", "T-433", "T-434", "T-36", "T-420", "T-5", "T-438", "T-441", "T-443"];

async function getExistingIds() {
    try {
        const res = await axios.get(`${API_BASE_URL}/technologies/ids`);
        return new Set(res.data);
    } catch (err) {
        console.warn('⚠️ Could not fetch existing IDs, assuming empty.'); // Don't crash
        return new Set();
    }
}

async function scrape() {
    console.log('🚀 Launching Puppeteer (Semi-Automated Mode)...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log('🌍 Opening CSIR page...');
    try {
        await page.goto(CSIR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
        console.log('⚠️ Initial navigation timed out, but browser is open.');
    }

    const existingIds = await getExistingIds();
    console.log(`ℹ️ Found ${existingIds.size} existing records.`);

    // MANUAL INTERVENTION POINT
    console.log('\n🛑 WAITING FOR USER INPUT:');
    console.log('1. Please verify the browser is open and the CSIR list is fully loaded.');
    console.log('2. If there is a CAPTCHA or error, please fix it manually in the browser.');
    console.log('3. When you are ready for me to start scraping, PRESS ENTER here in the terminal.\n');

    await new Promise(resolve => process.stdin.once('data', resolve));
    console.log('✅ Resuming scraping...');

    // Iterate over IDs. We assume the table order maps to allIds order.
    // NOTE: If table order is different, this mapping will be wrong. 
    // However, automation is clicking rows sequentially.

    const rowsSelector = '.panel-body table tr';
    try {
        // Wait up to 2 minutes for the table to appear
        await page.waitForSelector(rowsSelector, { timeout: 120000 });
    } catch (e) {
        console.error('❌ Timeout waiting for table. Saving screenshot...');
        await page.screenshot({ path: 'debug_timeout.png' });
        throw e;
    }

    // We loop through the expected IDs.
    // Warning: If the website list is dynamic or page-based, accessing by index is fragile.
    // But based on user feedback, it seems to be a single list.

    for (let i = 0; i < allIds.length; i++) {
        const id = allIds[i];
        if (existingIds.has(id)) {
            // console.log(`⏭️ Skipping ${id}`);
            continue;
        }

        console.log(`🔍 Processing index ${i} -> Expected ID: ${id}`);

        // Refresh rows handle
        const rows = await page.$$(rowsSelector);
        if (!rows[i]) {
            console.error(`❌ Row ${i} not found! Is the list paginated or shorter than expected?`);
            break;
        }

        const row = rows[i];
        const link = await row.$('td:first-child a');

        if (!link) {
            console.error(`❌ No link found in row ${i}`);
            continue;
        }

        // Click and wait for navigation
        // Better: Open in new tab to preserve list state?
        // Actually, "simpler" is click and goBack.

        // We need to wait for navigation.
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            link.click()
        ]);

        // Scrape details
        try {
            await page.waitForSelector('.panel-heading h3', { timeout: 5000 });

            const data: any = await page.evaluate(() => {
                const title = document.querySelector('.panel-heading h3')?.textContent?.trim() || '';
                const rows = document.querySelectorAll('.panel-body table tr');
                let res: any = { title };

                rows.forEach(r => {
                    const label = r.querySelector('td:first-child')?.textContent?.trim().toLowerCase() || '';
                    const value = r.querySelector('td:last-child')?.textContent?.trim() || '';

                    if (label.includes('value proposition')) res.valueProposition = value;
                    if (label.includes('application')) res.application = value;
                    if (label.includes('advantages')) res.advantages = value;
                    if (label.includes('readiness level')) res.trl = value;
                    if (label.includes('industrial applications')) res.category = value;
                    if (label.includes('patent')) res.patent = value;
                });

                // Sidebar
                const sidePanel = document.querySelectorAll('.panel.panel-default');
                const lastPanel = sidePanel[sidePanel.length - 1]; // Usually Contact Us
                const labName = lastPanel?.querySelector('.panel-heading h3')?.textContent?.trim() || 'Unknown Lab';
                const email = lastPanel?.querySelector('a[href^="mailto:"]')?.textContent?.trim() || 'info@csir.res.in'; // simplistic

                res.labName = labName;
                res.email = email;
                return res;
            });

            // Add ID from our list
            data.id = id;

            // Send to API
            const stakeholderId = `lab_${data.labName.replace(/[^\w]/g, '_').toLowerCase()}`;
            const trlMatch = data.trl ? data.trl.match(/\d+/) : null;
            const trlLevel = trlMatch ? parseInt(trlMatch[0]) : 1;

            const payload = {
                tech: {
                    id: data.id,
                    name: data.title,
                    stakeholder_id: stakeholderId,
                    tech_category_id: data.category ? data.category.split(',')[0].trim() : 'General',
                    description: data.valueProposition || 'No description available.',
                    ip_status: (data.patent && data.patent !== 'N/A' && data.patent !== 'Not listed') ? 'patented' : 'know-how',
                    patent_number: (data.patent && data.patent !== 'N/A' && data.patent !== 'Not listed') ? data.patent : null,
                    trl_level: trlLevel
                },
                stakeholder: {
                    stakeholder_id: stakeholderId,
                    name: data.labName,
                    category: 'Research Institution',
                    website: '',
                    contact_email: data.email.replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.')
                }
            };

            try {
                await axios.post(`${API_BASE_URL}/technologies/import`, payload);
                console.log(`✅ Imported ${id}: ${data.title}`);
            } catch (apiErr: any) {
                console.error(`❌ API Error for ${id}:`, apiErr.message);
            }

        } catch (e: any) {
            console.error(`❌ Error scraping details for ${id}:`, e.message);
        }

        // Go back
        await page.goBack({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector(rowsSelector); // Wait for list to load

        // Small Delay
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }

    await browser.close();
}

scrape();
