<?php

/*
 * Copyright 2005 - 2021 Centreon (https://www.centreon.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * For more information : contact@centreon.com
 *
 */

include_once __DIR__ . "/../../class/centreonLog.class.php";
$centreonLog = new CentreonLog();

//error specific content
$versionOfTheUpgrade = 'UPGRADE - 21.04.7: ';

$pearDB = new CentreonDB('centreon', 3, false);

/**
 * Query with transaction
 */
try {
    $pearDB->beginTransaction();

    // Add TLS hostname in config brocker for input/outputs IPV4
    $statement = $pearDB->query("SELECT cb_field_id from cb_field WHERE fieldname = 'tls_hostname'");
    if ($statement->fetchColumn() === false) {
        $errorMessage  = 'Unable to update cb_field';
        $pearDB->query("
            INSERT INTO `cb_field` (
                `cb_field_id`, `fieldname`,`displayname`,
                `description`,
                `fieldtype`, `external`
            ) VALUES (
                null, 'tls_hostname', 'TLS Host name',
                'Expected TLS certificate common name (CN) - leave blank if unsure.',
                'text', NULL
            )
        ");

        $errorMessage  = 'Unable to update cb_type_field_relation';
        $fieldId = $pearDB->lastInsertId();
        $pearDB->query("
            INSERT INTO `cb_type_field_relation` (`cb_type_id`, `cb_field_id`, `is_required`, `order_display`) VALUES
            (3, " . $fieldId . ", 0, 5)
        ");
    }

    if ($pearDB->inTransaction()) {
        $pearDB->commit();
    }
} catch (\Exception $e) {
    if ($pearDB->inTransaction()) {
        $pearDB->rollBack();
    }
    $centreonLog->insertLog(
        4,
        $versionOfTheUpgrade . $errorMessage .
        " - Code : " . (int)$e->getCode() .
        " - Error : " . $e->getMessage() .
        " - Trace : " . $e->getTraceAsString()
    );
    throw new \Exception($versionOfTheUpgrade . $errorMessage, (int)$e->getCode(), $e);
}
