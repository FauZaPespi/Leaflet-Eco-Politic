<?php
// Définir le chemin du fichier JSON des rapports
define('REPORTS_FILE', 'files/json/reports.json');

// Récupérer et assainir les données envoyées par POST
$country = filter_input(INPUT_POST, 'countryWrong', FILTER_UNSAFE_RAW);
$problemType = filter_input(INPUT_POST, 'problem', FILTER_UNSAFE_RAW);
$newData = filter_input(INPUT_POST, 'newData', FILTER_UNSAFE_RAW);
$ipAddress = $_SERVER['REMOTE_ADDR'];
$ipAddress = rand() . $_SERVER['REMOTE_ADDR'];  // Ajouter un nombre aléatoire à l'adresse IP

// Charger les rapports existants depuis le fichier JSON
if (file_exists(REPORTS_FILE)) {
    $data = json_decode(file_get_contents(REPORTS_FILE), true);
    if (!is_array($data)) {
        $data = ["reports" => [], "massReports" => []];  // Initialiser si le fichier est mal formaté
    } else {
        // S'assurer que les clés "reports" et "massReports" existent sous forme de tableaux
        $data["reports"] = $data["reports"] ?? [];
        $data["massReports"] = $data["massReports"] ?? [];
    }
} else {
    $data = ["reports" => [], "massReports" => []];  // Si le fichier n'existe pas, initialiser des tableaux vides
}

// Vérifier le nombre de rapports par IP pour le pays sélectionné
if ($country && $problemType) {
    // Compter les rapports existants de cette IP pour le pays
    $ipReportCount = array_reduce($data["reports"], function ($count, $report) use ($ipAddress, $country) {
        return $count + (($report['ip'] === $ipAddress && $report['country'] === $country) ? 1 : 0);
    }, 0);

    if ($ipReportCount >= 3) {
        // Limite atteinte pour ce pays
        echo "<div class='error'>Vous avez atteint la limite de 3 rapports pour ce pays.</div>";
    } else {
        // Ajouter le nouveau rapport
        $data["reports"][] = [
            "ip" => $ipAddress,
            "country" => $country,
            "problem_type" => $problemType,
            "old_name" => '',  // Nom ancien, ici vide
            "new_name" => $newData  // Nouveau nom ou nouvelle donnée
        ];

        echo "<div class='thanksU'>Merci pour votre rapport !</div>";

        // Mettre à jour les statistiques des rapports pour le pays
        if (!isset($data["massReports"][$country])) {
            $data["massReports"][$country] = ["report_count" => 0, "name_issue_count" => 0, "dataEP_issue_count" => 0];
        }

        // Incrémenter les compteurs selon le type de problème
        $data["massReports"][$country]["report_count"] += 1;
        if ($problemType === "name") {
            $data["massReports"][$country]["name_issue_count"] += 1;
        } elseif ($problemType === "dataEP") {
            $data["massReports"][$country]["dataEP_issue_count"] += 1;
        }

        // Sauvegarder les données mises à jour dans le fichier JSON
        file_put_contents(REPORTS_FILE, json_encode($data, JSON_PRETTY_PRINT));
    }
}

// Trouver le pays avec le plus grand nombre de rapports
$countryWithMostReports = null;
$highestReportCount = 0;

foreach ($data["massReports"] as $countryName => $issueCounts) {
    if ($issueCounts['report_count'] > $highestReportCount) {
        $highestReportCount = $issueCounts['report_count'];
        $countryWithMostReports = $countryName;
    }
}

// Afficher un message d'attention pour le pays ayant le plus de rapports, si nécessaire
if ($countryWithMostReports && $highestReportCount >= 3) {
    echo "<div class='updateMessage'><div class='scrollingText'>Les données pour le pays <highlight>{$countryWithMostReports}</highlight> nécessitent une attention particulière en raison de rapports récurrents.</div></div>";
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
    <link rel="shortcut icon" href="files/media/SEP_icon.png" type="image/x-icon">
    <script src="files/js/index.js" defer></script>
</head>

<body>
    <div class="Year-Selector">
        <input type="range" name="inputRangeYear" id="inputRangeYear" min="1900" max="2024" value="2024" step="1">
    </div>
    <div id="map"></div>
    <div class="backgroundBlurlegend"></div>
    <div id="state-legend" class="legend">
        <h4>Système Eco-Politique</h4>
        <div><span style="background-color: #1f77b4"></span> Capitalisme</div>
        <div><span style="background-color: #ff7f0e"></span> Socialisme</div>
        <div><span style="background-color: #2ca02c"></span> Communisme</div>
        <div><span style="background-color: #d62728"></span> Fascisme</div>
        <div><span style="background-color: #310d94"></span> Monarchie</div>
        <div><span style="background-color: #9467bd"></span> Inconnu</div>
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
                $problems = ['name' => 'Nom incorrect', 'dataEP' => 'Données Eco-Politique incorrectes'];

                foreach ($problems as $key => $label) {
                    $isSelected = ($key === $selectedProblem) ? 'selected' : '';
                    echo "<option value=\"$key\" $isSelected>$label</option>";
                }
                ?>
            </select>
            <input type="text" name="newData" id="newData" placeholder="Entrez les nouvelles données" value="<?php echo filter_input(INPUT_POST, 'newData', FILTER_UNSAFE_RAW); ?>">
            <button type="submit">Signaler le problème</button>
        </form>
    </div>
</body>

</html>