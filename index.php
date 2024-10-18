<?php
$country = filter_input(INPUT_POST, 'countryWrong', FILTER_UNSAFE_RAW);
$problemType = filter_input(INPUT_POST, 'problem', FILTER_UNSAFE_RAW);
$newData = filter_input(INPUT_POST, 'newData', FILTER_UNSAFE_RAW);

if ($country && $problemType) {
    $filePath = 'files/json/users/problem.json';

    if (file_exists($filePath)) {
        $problemData = json_decode(file_get_contents($filePath), true);
    } else {
        $problemData = [];
    }

    if (!isset($problemData[$country])) {
        $problemData[$country] = [
            'name' => ['count' => 0, 'issues' => []],
            'dataEP' => ['count' => 0, 'issues' => []]
        ];
    }

    if (isset($problemData[$country][$problemType])) {
        $problemData[$country][$problemType]['count']++;

        if ($newData) {
            $problemData[$country][$problemType]['issues'][] = $newData;
        }

        file_put_contents($filePath, json_encode($problemData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo "<div class='thanksU'>Thank you for your report! <3</div>";
    } else {
        echo "<div class='error'>Invalid problem type.</div>";
    }
} else {
    echo "<div class='error'>Please provide all required information.</div>";
}
?>




<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Systeme économique en Europe | 2024</title>
    <link rel="stylesheet" href="files/css/lib/leaflet.css" />
    <script src="files/js/lib/leaflet.js"></script>
    <script src="files/js/lib/leaflet.ajax.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="stylesheet" href="files/css/base.css">
    <script src="files/js/index.js" defer></script>
</head>

<body>
    <div class="Year-Selector">
        <form action="POST">
            <input type="range" name="inputRangeYear" id="inputRangeYear" min="1900" max="2024" value="2024" step="1">
        </form>
    </div>
    <div id="map"></div>
    <div id="state-legend" class="legend">
        <h4>Eco-Politic System</h4>
        <div><span style="background-color: #1f77b4"></span> Capitalism</div>
        <div><span style="background-color: #ff7f0e"></span> Socialism</div>
        <div><span style="background-color: #2ca02c"></span> Communism</div>
        <div><span style="background-color: #d62728"></span> Fascism</div>
        <div><span style="background-color: #310d94"></span> Monarchie</div>
        <div><span style="background-color: #9467bd"></span> Mixed Economy</div>
    </div>
    <div class="askWrong">
        <form action="index.php" method="POST">
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