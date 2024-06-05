<?php
$mysqli = require __DIR__ . "/database.php";

if ($mysqli->connect_error) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Database connection failed: " . $mysqli->connect_error]);
    exit;
}

$size = isset($_GET['size']) ? $_GET['size'] : '';

$query = "SELECT * FROM products";
if (!empty($size)) {
    $query .= " WHERE Size = ?";
}

$stmt = $mysqli->prepare($query);
if (!$stmt) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Failed to prepare SQL statement"]);
    exit;
}

if (!empty($size)) {
    $stmt->bind_param("s", $size);
}

$result = $stmt->execute();
if (!$result) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Failed to execute SQL query: " . $stmt->error]);
    exit;
}

$result = $stmt->get_result();
if (!$result) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Failed to get results from query"]);
    exit;
}

$products = $result->fetch_all(MYSQLI_ASSOC);

$stmt->close();
$mysqli->close();

echo json_encode($products);
