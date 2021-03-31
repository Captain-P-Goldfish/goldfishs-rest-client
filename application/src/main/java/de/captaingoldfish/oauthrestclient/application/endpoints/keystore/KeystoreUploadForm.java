package de.captaingoldfish.oauthrestclient.application.endpoints.keystore;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * This form is used in the first step of uploading a keystore Is is used to upload a {@link MultipartFile}
 * that hopefully contains keystore data that will be validated and cached for the second step
 * 
 * @see KeystoreAliasForm
 * @author Pascal Knueppel
 * @since 26.03.2021
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@KeystoreUploadFormValidation
class KeystoreUploadForm
{

  /**
   * the password to open the keystore
   */
  private String keystorePassword;

  /**
   * the uploaded file that hopefully is a keystore file
   */
  private MultipartFile keystoreFile;

}
