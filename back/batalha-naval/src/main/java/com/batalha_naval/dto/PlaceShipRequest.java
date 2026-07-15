package com.batalha_naval.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class PlaceShipRequest {

    @NotBlank(message = "shipType é obrigatório")
    private String shipType;

    @NotNull(message = "row é obrigatório")
    @Min(value = 0, message = "row deve ser entre 0 e 9")
    @Max(value = 9, message = "row deve ser entre 0 e 9")
    private Integer row;

    @NotNull(message = "col é obrigatório")
    @Min(value = 0, message = "col deve ser entre 0 e 9")
    @Max(value = 9, message = "col deve ser entre 0 e 9")
    private Integer col;

    @NotBlank(message = "orientation é obrigatório")
    private String orientation;

    public PlaceShipRequest() {}

    public PlaceShipRequest(String shipType, int row, int col, String orientation) {
        this.shipType = shipType;
        this.row = row;
        this.col = col;
        this.orientation = orientation;
    }

    public String getShipType() { return shipType; }
    public void setShipType(String shipType) { this.shipType = shipType; }
    public Integer getRow() { return row; }
    public void setRow(Integer row) { this.row = row; }
    public Integer getCol() { return col; }
    public void setCol(Integer col) { this.col = col; }
    public String getOrientation() { return orientation; }
    public void setOrientation(String orientation) { this.orientation = orientation; }
}
