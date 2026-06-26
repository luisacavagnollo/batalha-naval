package com.batalha_naval.dto;

public class PlaceShipRequest {
    private String shipType;
    private int row;
    private int col;
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
    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }
    public int getCol() { return col; }
    public void setCol(int col) { this.col = col; }
    public String getOrientation() { return orientation; }
    public void setOrientation(String orientation) { this.orientation = orientation; }
}
