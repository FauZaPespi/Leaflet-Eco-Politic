<?php
// Toutes les requêtes ont été générées en partie par ChatGPT.


// Connexion à la base de données SQLite
$db = new PDO('sqlite:files/database/reports.db');

// Récupération et filtrage des données postées
$country = filter_input(INPUT_POST, 'countryWrong', FILTER_UNSAFE_RAW);
$problemType = filter_input(INPUT_POST, 'problem', FILTER_UNSAFE_RAW);
$newData = filter_input(INPUT_POST, 'newData', FILTER_UNSAFE_RAW);
//$ipAddress = strval(rand()) . $_SERVER['REMOTE_ADDR'];
$ipAddress = $_SERVER['REMOTE_ADDR']; // L'autre ligne permettait de générer une adresse aléatoire, utile pour le débogage...

// Vérification du nombre de rapports par IP pour le pays
if ($country && $problemType) {
    $checkStmt = $db->prepare("SELECT COUNT(*) FROM reports WHERE ip = :ip AND country = :country");
    $checkStmt->execute([':ip' => $ipAddress, ':country' => $country]);
    $ipReportCount = $checkStmt->fetchColumn();

    if ($ipReportCount >= 3) {
        // Limite atteinte pour ce pays
        echo "<div class='error'>Vous avez atteint la limite de 3 rapports pour ce pays.</div>";
    } else {
        // Insertion du nouveau rapport
        $stmt = $db->prepare("INSERT INTO reports (ip, country, problem_type, old_name, new_name) VALUES (:ip, :country, :problemType, :oldName, :newData)");
        $stmt->execute([
            ':ip' => $ipAddress,
            ':country' => $country,
            ':problemType' => $problemType,
            ':oldName' => '',
            ':newData' => $newData
        ]);

        echo "<div class='thanksU'>Merci pour votre rapport !</div>";

        // Mise à jour des statistiques de rapports pour le pays
        $countStmt = $db->prepare("SELECT COUNT(*) FROM reports WHERE country = :country");
        $countStmt->execute([':country' => $country]);
        $countryReportCount = $countStmt->fetchColumn();

        if ($countryReportCount >= 5) {
            $updateMassReportStmt = $db->prepare("
                INSERT INTO massReport (country, report_count, name_issue_count, dataEP_issue_count)
                VALUES (:country, :reportCount, CASE WHEN :problemType = 'name' THEN 1 ELSE 0 END, CASE WHEN :problemType = 'dataEP' THEN 1 ELSE 0 END)
                ON CONFLICT(country) DO UPDATE SET
                    report_count = report_count + 1,
                    name_issue_count = CASE WHEN :problemType = 'name' THEN name_issue_count + 1 ELSE name_issue_count END,
                    dataEP_issue_count = CASE WHEN :problemType = 'dataEP' THEN dataEP_issue_count + 1 ELSE dataEP_issue_count END
            ");
            $updateMassReportStmt->execute([
                ':country' => $country,
                ':reportCount' => $countryReportCount,
                ':problemType' => $problemType
            ]);
        }
    }
}

// Récupération des statistiques de rapports pour tous les pays
$problemCountStmt = $db->prepare("
    SELECT country, name_issue_count, dataEP_issue_count 
    FROM massReport
");
$problemCountStmt->execute();
$allIssueCounts = $problemCountStmt->fetchAll(PDO::FETCH_ASSOC);

// Affichage d'un message si des pays nécessitent une attention particulière
foreach ($allIssueCounts as $issueCounts) {
    if (($issueCounts['name_issue_count'] >= 3) || ($issueCounts['dataEP_issue_count'] >= 3)) {
        echo "<div class='updateMessage'><div class='scrollingText'>Les données pour le pays {$issueCounts['country']} nécessitent une attention particulière en raison de rapports récurrents.</div></div>";
    }
}
?>

<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Systeme Eco-Politic en Europe | 2024</title>
    <link rel="stylesheet" href="files/css/lib/leaflet.css" />
    <script src="files/js/lib/leaflet.js"></script>
    <script src="files/js/lib/leaflet.ajax.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="stylesheet" href="files/css/base.css">
    <script src="files/js/index.js" defer></script>
</head>

<body>
    <div class="Year-Selector">
        <input type="range" name="inputRangeYear" id="inputRangeYear" min="1900" max="2024" value="2024" step="1">
    </div>
    <div id="map"></div>
    <div class="backgroundBlurlegend"></div>
    <div id="state-legend" class="legend">
        <h4>Eco-Politic System</h4>
        <div><span style="background-color: #1f77b4"></span> Capitalism</div>
        <div><span style="background-color: #ff7f0e"></span> Socialism</div>
        <div><span style="background-color: #2ca02c"></span> Communism</div>
        <div><span style="background-color: #d62728"></span> Fascism</div>
        <div><span style="background-color: #310d94"></span> Monarchie</div>
        <div><span style="background-color: #9467bd"></span> Mixed Economy</div>
    </div>
    <div class="backgroundBlur"></div>
    <div class="askWrong">
        <form class="askWrongForm" action="index.php" method="POST">
            <select name="countryWrong" id="countryWrong">
                <?php
                $countries = json_decode(file_get_contents("files/json/2024/data.json"), true);

                $selectedCountry = filter_input(INPUT_POST, 'countryWrong', FILTER_UNSAFE_RAW);

                foreach ($countries as $country => $system) {
                    $isSelected = ($country === $selectedCountry) ? 'selected' : '';
                    echo "<option value=\"$country\" $isSelected>$country</option>";
                }
                ?>
            </select>
            <select name="problem" id="problem">
                <?php
                $selectedProblem = filter_input(INPUT_POST, 'problem', FILTER_UNSAFE_RAW);

                $problems = [
                    'name' => 'Wrong Name',
                    'dataEP' => 'Wrong Eco-Politic data'
                ];

                foreach ($problems as $key => $label) {
                    $isSelected = ($key === $selectedProblem) ? 'selected' : '';
                    echo "<option value=\"$key\" $isSelected>$label</option>";
                }
                ?>
            </select>
            <input type="text" name="newData" id="newData" placeholder="Enter new data" value="<?php echo filter_input(INPUT_POST, 'newData', FILTER_UNSAFE_RAW); ?>">
            <button type="submit">Report Problem</button>
        </form>
    </div>


</body>

</html>