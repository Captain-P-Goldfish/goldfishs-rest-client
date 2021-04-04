package de.captaingoldfish.oauthrestclient.application.endpoints.truststore;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * @author Pascal Knueppel
 * @since 04.04.2021
 */
@Data
@NoArgsConstructor
public class TruststoreUploadResponseForm
{

  /**
   * will be returned in case of a certificate upload. It indicates that adding the certificate under this alias
   * was successful
   */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private String alias;

  /**
   * will be returned in case of a truststore upload. The list contains all aliases that could not be merged
   * into the application keystore because the key did already exist or the alias was already present
   */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private List<String> duplicateAliases;

  /**
   * will be returned in case of a truststore upload. The list contains all the aliases that contain a
   * certificate that is already present within the application keystore under another alias name.
   */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private List<String> duplicateCertificates;

  @Builder
  public TruststoreUploadResponseForm(String alias, List<String> duplicateAliases, List<String> duplicateCertificates)
  {
    this.alias = alias;
    this.duplicateAliases = duplicateAliases == null || duplicateAliases.isEmpty() ? null : duplicateAliases;
    this.duplicateCertificates = duplicateCertificates == null || duplicateCertificates.isEmpty() ? null
      : duplicateCertificates;
  }
}
