package de.captaingoldfish.restclient.application.endpoints.truststore.validation;

import java.util.Base64;
import java.util.Optional;

import de.captaingoldfish.restclient.commons.keyhelper.KeyStoreSupporter;
import de.captaingoldfish.restclient.commons.keyhelper.KeyStoreSupporter.KeyStoreType;
import de.captaingoldfish.restclient.scim.resources.ScimTruststore.TruststoreUpload;
import de.captaingoldfish.scim.sdk.server.endpoints.validation.ValidationContext;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;


/**
 * @author Pascal Knueppel
 * @since 19.05.2021
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TruststoreUploadValidator
{

  /**
   * validates that the truststore that is being uploaded contains valid data
   */
  public static void validateTruststoreUpload(TruststoreUpload truststoreUpload, ValidationContext validationContext)
  {
    byte[] decodedTruststoreFile;
    try
    {
      decodedTruststoreFile = Base64.getDecoder().decode(truststoreUpload.getTruststoreFile());
    }
    catch (IllegalArgumentException ex)
    {
      validationContext.addError("truststoreUpload.truststoreFile",
                                 String.format("Truststore file is not Base64 encoded: %s", ex.getMessage()));
      return;
    }

    if (decodedTruststoreFile == null || decodedTruststoreFile.length == 0)
    {
      validationContext.addError("truststoreUpload.truststoreFile", "Truststore file must not be empty");
      return;
    }

    final String fileName = truststoreUpload.getTruststoreFileName().orElse("truststore.jks");
    final KeyStoreType keyStoreType = KeyStoreType.byFileExtension(fileName).orElse(KeyStoreType.JKS);

    if (KeyStoreType.PKCS12.equals(keyStoreType) && truststoreUpload.getTruststorePassword().isEmpty())
    {
      String errormessage = "Not accepting empty passwords for PKCS12 keystore type";
      log.debug(errormessage);
      validationContext.addError("truststoreUpload.truststorePassword", errormessage);
    }

    try
    {
      final String password = truststoreUpload.getTruststorePassword().orElse(null);
      KeyStoreSupporter.readTruststore(decodedTruststoreFile, keyStoreType, password);
    }
    catch (Exception ex)
    {
      Throwable current = ex;
      while (current != null)
      {
        String errormessage = Optional.ofNullable(current.getMessage()).orElse("NullPointerException");
        log.debug(errormessage);
        validationContext.addError("truststoreUpload.truststoreFile", errormessage);
        current = current.getCause();
      }
    }
  }
}
